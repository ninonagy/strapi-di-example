/**
 * article service.
 */

import { Core, factories, UID } from "@strapi/strapi";

export abstract class BaseService<T extends UID.ContentType> {
  private _baseService: Partial<
    Core.CoreAPI.Service.SingleType & Core.CoreAPI.Service.CollectionType
  >;

  constructor(
    protected strapi: Core.Strapi,
    public uid: T
  ) {
    this._baseService = factories.createCoreService(uid, () => ({}))({
      strapi,
    }) as any;
  }

  private get base() {
    return this._baseService;
  }

  // Default methods you can override
  async find(params: object) {
    return this.base.find(params);
  }

  async findOne(id, params) {
    return this.base.findOne(id, params);
  }

  async create(params) {
    return this.base.create(params);
  }

  async createOrUpdate(params) {
    return this.base.createOrUpdate(params);
  }

  async update(id, params) {
    return this.base.update(id, params);
  }

  async delete(params) {
    return this.base?.find(params);
  }
}

export class ArticleService extends BaseService<"api::article.article"> {
  constructor(strapi: Core.Strapi) {
    super(strapi, "api::article.article");
  }

  async customFind(id: any) {
    console.log("customFind", id);
    return { items: [] };
  }

  async find(params: any) {
    return super.find(params); // ✅ calling base find
  }
}

function createCustomService<T extends Record<string, any>>(
  uid: UID.ContentType,
  serviceClass: new (...args: any[]) => T
) {
  return factories.createCoreService(uid, ({ strapi }) => {
    const service = new serviceClass(strapi, uid);

    const exposed: Record<string, any> = {};

    const proto = Object.getPrototypeOf(service);
    // Auto-bind all public methods (except constructor)
    const methods = Object.getOwnPropertyNames(proto).filter(
      (key) => key !== "constructor" && typeof proto[key] === "function"
    );
    for (const methodName of methods) {
      exposed[methodName] = service[methodName].bind(service);
    }

    return exposed;
  });
}

export default createCustomService("api::article.article", ArticleService);
