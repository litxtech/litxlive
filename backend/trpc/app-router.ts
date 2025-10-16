import { createTRPCRouter } from "./create-context";
import hiRoute from "./routes/example/hi/route";
import { adminStatsRoute } from "./routes/admin/stats/route";
import {
  adminUsersListRoute,
  adminUserBanRoute,
  adminUserUnbanRoute,
  adminUserVerifyRoute,
} from "./routes/admin/users/route";
import {
  adminUserSearchUsersRoute,
  adminUserSearchByUniqueIdRoute,
  adminUserAddCoinsByUniqueIdRoute,
  adminUserBanByUniqueIdRoute,
  adminUserSetUnlimitedCoinsRoute,
  adminUserVerifyByUniqueIdRoute,
  adminUserGenerateReferralCodeRoute,
  adminUserGetAnalyticsRoute,
  adminUserBulkAddCoinsRoute,
  adminUserGetTopUsersRoute,
} from "./routes/admin/users/unique-id-route";
import {
  adminModerationReportsRoute,
  adminModerationResolveRoute,
} from "./routes/admin/moderation/route";
import {
  adminLiveStatsRoute,
  adminLiveRoomsRoute,
} from "./routes/admin/live/route";
import { purchasesListRoute } from "./routes/purchases/list/route";
import { purchasesBalanceRoute } from "./routes/purchases/balance/route";
import { purchasesCreateRoute } from "./routes/purchases/create/route";
import { purchasesValidateRoute } from "./routes/purchases/validate/route";
import { policiesRouter } from "./routes/policies";
import {
  adminEconomyGetSettingsRoute,
  adminEconomyUpdateSettingRoute,
} from "./routes/admin/economy/index";
import { adminUserGetProfileRoute, adminUserUpdateProfileRoute } from "./routes/admin/users/profile";
import { adminUsersCreateTestRoute } from "./routes/admin/users/create-test/route";
import { stripeCreatePaymentIntentRoute } from "./routes/purchases/stripe/create-payment-intent";
import { stripeConfirmPaymentRoute } from "./routes/purchases/stripe/confirm-payment";

export const appRouter = createTRPCRouter({
  example: createTRPCRouter({
    hi: hiRoute,
  }),
  admin: createTRPCRouter({
    stats: adminStatsRoute,
    users: createTRPCRouter({
      list: adminUsersListRoute,
      ban: adminUserBanRoute,
      unban: adminUserUnbanRoute,
      verify: adminUserVerifyRoute,
      searchUsers: adminUserSearchUsersRoute,
      searchByUniqueId: adminUserSearchByUniqueIdRoute,
      addCoinsByUniqueId: adminUserAddCoinsByUniqueIdRoute,
      banByUniqueId: adminUserBanByUniqueIdRoute,
      setUnlimitedCoins: adminUserSetUnlimitedCoinsRoute,
      verifyByUniqueId: adminUserVerifyByUniqueIdRoute,
      generateReferralCode: adminUserGenerateReferralCodeRoute,
      getAnalytics: adminUserGetAnalyticsRoute,
      bulkAddCoins: adminUserBulkAddCoinsRoute,
      getTopUsers: adminUserGetTopUsersRoute,
      getProfile: adminUserGetProfileRoute,
      updateProfile: adminUserUpdateProfileRoute,
      createTest: adminUsersCreateTestRoute,
    }),
    moderation: createTRPCRouter({
      reports: adminModerationReportsRoute,
      resolve: adminModerationResolveRoute,
    }),
    live: createTRPCRouter({
      stats: adminLiveStatsRoute,
      rooms: adminLiveRoomsRoute,
    }),
    economy: createTRPCRouter({
      getSettings: adminEconomyGetSettingsRoute,
      updateSetting: adminEconomyUpdateSettingRoute,
    }),
  }),
  purchases: createTRPCRouter({
    list: purchasesListRoute,
    balance: purchasesBalanceRoute,
    create: purchasesCreateRoute,
    validate: purchasesValidateRoute,
    stripe: createTRPCRouter({
      createPaymentIntent: stripeCreatePaymentIntentRoute,
      confirmPayment: stripeConfirmPaymentRoute,
    }),
  }),
  policies: policiesRouter,
});

export type AppRouter = typeof appRouter;
