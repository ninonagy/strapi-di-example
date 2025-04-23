/**
 *  article controller
 */

import { Core, factories, UID } from "@strapi/strapi";
import { ArticleService } from "../services/article";
import { Context, Next } from "koa";

const injectMetadataKey = Symbol("injectServices");

export function InjectService(
  serviceUid: UID.ContentType
): PropertyDecorator & ParameterDecorator {
  return function (target: any, propertyKey: string) {
    if (!Reflect.hasMetadata(injectMetadataKey, target.constructor)) {
      Reflect.defineMetadata(injectMetadataKey, {}, target.constructor);
    }

    const metadata = Reflect.getMetadata(injectMetadataKey, target.constructor);
    metadata[propertyKey] = serviceUid;
  };
}

export function getInjectedServices(
  target: any
): Record<string, UID.ContentType> {
  return Reflect.getMetadata(injectMetadataKey, target.constructor) || {};
}

export abstract class BaseController<T extends UID.ContentType> {
  private _baseController: Partial<
    Core.CoreAPI.Controller.SingleType & Core.CoreAPI.Controller.CollectionType
  >;

  constructor(
    protected strapi: Core.Strapi,
    public uid: T
  ) {
    this._baseController = factories.createCoreController(uid, () => ({}))({
      strapi,
    });
  }

  private get base() {
    return this._baseController;
  }

  // Default methods you can override
  async find(ctx: Context, next?: Next) {
    return this.base.find(ctx, next);
  }

  async findOne(ctx: Context, next?: Next) {
    return this.base.findOne(ctx, next);
  }

  async create(ctx: Context, next?: Next) {
    return this.base.create(ctx, next);
  }

  async update(ctx: Context, next?: Next) {
    return this.base.update(ctx, next);
  }

  async delete(ctx: Context, next?: Next) {
    return this.base.delete(ctx, next);
  }
}

class ArticleController extends BaseController<"api::article.article"> {
  @InjectService("api::article.article")
  private articleService: ArticleService;

  // constructor(strapi: Core.Strapi) {
  //   super(strapi, "api::article.article");
  // }

  async findOne(ctx: Context) {
    console.log("Custom findOne");
    const result = await this.articleService.customFind(1);
    return result;
  }

  async find(ctx: Context) {
    console.log("Overriding base find");
    return super.find(ctx); // ✅ calling base find
  }
}

function createCustomController<
  TUID extends UID.ContentType,
  T extends BaseController<TUID>,
>(uid: UID.ContentType, controllerClass: new (...args: any[]) => T) {
  return factories.createCoreController(uid, ({ strapi }) => {
    const controller = new controllerClass(strapi, uid);

    // Inject services
    const serviceMap = getInjectedServices(controller);
    for (const [prop, serviceUid] of Object.entries(serviceMap)) {
      (controller as any)[prop] = strapi.service(serviceUid);
    }

    const exposed: Record<string, any> = {};

    const proto = Object.getPrototypeOf(controller);
    // Auto-bind all public methods (except constructor)
    const methods = Object.getOwnPropertyNames(proto).filter(
      (key) => key !== "constructor" && typeof proto[key] === "function"
    );
    for (const methodName of methods) {
      exposed[methodName] = controller[methodName].bind(controller);
    }

    return exposed;
  });
}

export default createCustomController(
  "api::article.article",
  ArticleController
);
