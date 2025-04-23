/**
 * category service.
 */

import { factories } from "@strapi/strapi";

export default factories.createCoreService(
  "api::category.category",
  ({ strapi }) => ({
    async findOne(ctx) {
      return super.findOne(ctx);
    },
  })
);
