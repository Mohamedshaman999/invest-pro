import { sequelize } from "../config/database.js";
import { defineUser } from "./User.js";
import { defineAsset } from "./Asset.js";
import { defineTransaction } from "./Transaction.js";
import { definePortfolio } from "./Portfolio.js";
import { defineKnownDevice } from "./KnownDevice.js";
import { defineRefreshToken } from "./RefreshToken.js";
import { defineAssetPriceHistory } from "./AssetPriceHistory.js";
import { definePriceAlertEmailLog } from "./PriceAlertEmailLog.js";
import { defineWallet } from "./Wallet.js";
import { defineAiTradingBot } from "./AiTradingBot.js";
import { defineAiTradingRule } from "./AiTradingRule.js";
import { defineAiTradingTransaction } from "./AiTradingTransaction.js";
import { defineConversation } from "./Conversation.js";
import { defineMessage } from "./Message.js";
import { defineAiConversation } from "./AiConversation.js";
import { defineAiMessage } from "./AiMessage.js";
import { defineLoginAttemptLog } from "./LoginAttemptLog.js";

export const User = defineUser(sequelize);
export const Asset = defineAsset(sequelize);
export const Transaction = defineTransaction(sequelize);
export const Portfolio = definePortfolio(sequelize);
export const KnownDevice = defineKnownDevice(sequelize);
export const RefreshToken = defineRefreshToken(sequelize);
export const AssetPriceHistory = defineAssetPriceHistory(sequelize);
export const PriceAlertEmailLog = definePriceAlertEmailLog(sequelize);
export const Wallet = defineWallet(sequelize);
export const AiTradingBot = defineAiTradingBot(sequelize);
export const AiTradingRule = defineAiTradingRule(sequelize);
export const AiTradingTransaction = defineAiTradingTransaction(sequelize);
export const Conversation = defineConversation(sequelize);
export const Message = defineMessage(sequelize);
export const AiConversation = defineAiConversation(sequelize);
export const AiMessage = defineAiMessage(sequelize);
export const LoginAttemptLog = defineLoginAttemptLog(sequelize);

User.hasMany(Transaction, { foreignKey: "userId", as: "transactions" });
Transaction.belongsTo(User, { foreignKey: "userId", as: "user" });

User.hasMany(Portfolio, { foreignKey: "userId", as: "portfolios" });
Portfolio.belongsTo(User, { foreignKey: "userId", as: "user" });

User.hasMany(KnownDevice, { foreignKey: "userId", as: "knownDevices" });
KnownDevice.belongsTo(User, { foreignKey: "userId", as: "user" });

User.hasMany(RefreshToken, { foreignKey: "userId", as: "refreshTokens" });
RefreshToken.belongsTo(User, { foreignKey: "userId", as: "user" });

Asset.hasMany(Transaction, { foreignKey: "assetId", as: "transactions" });
Transaction.belongsTo(Asset, { foreignKey: "assetId", as: "asset" });

Asset.hasMany(Portfolio, { foreignKey: "assetId", as: "portfolios" });
Portfolio.belongsTo(Asset, { foreignKey: "assetId", as: "asset" });

Asset.hasMany(AssetPriceHistory, { foreignKey: "assetId", as: "priceHistory" });
AssetPriceHistory.belongsTo(Asset, { foreignKey: "assetId", as: "asset" });

User.hasMany(PriceAlertEmailLog, { foreignKey: "userId", as: "priceAlertEmailLogs" });
PriceAlertEmailLog.belongsTo(User, { foreignKey: "userId", as: "user" });
Asset.hasMany(PriceAlertEmailLog, { foreignKey: "assetId", as: "priceAlertEmailLogs" });
PriceAlertEmailLog.belongsTo(Asset, { foreignKey: "assetId", as: "asset" });

User.hasOne(Wallet, { foreignKey: "userId", as: "wallet" });
Wallet.belongsTo(User, { foreignKey: "userId", as: "user" });

User.hasMany(AiTradingBot, { foreignKey: "userId", as: "aiTradingBots" });
AiTradingBot.belongsTo(User, { foreignKey: "userId", as: "user" });

AiTradingBot.hasMany(AiTradingRule, { foreignKey: "botId", as: "rules" });
AiTradingRule.belongsTo(AiTradingBot, { foreignKey: "botId", as: "bot" });

AiTradingBot.hasMany(AiTradingTransaction, { foreignKey: "botId", as: "aiTransactions" });
AiTradingTransaction.belongsTo(AiTradingBot, { foreignKey: "botId", as: "bot" });
User.hasMany(AiTradingTransaction, { foreignKey: "userId", as: "aiTradingTransactions" });
AiTradingTransaction.belongsTo(User, { foreignKey: "userId", as: "user" });

User.hasMany(Conversation, { foreignKey: "userId", as: "conversations" });
Conversation.belongsTo(User, { foreignKey: "userId", as: "user" });

Conversation.hasMany(Message, { foreignKey: "conversationId", as: "messages" });
Message.belongsTo(Conversation, { foreignKey: "conversationId", as: "conversation" });

User.hasMany(AiConversation, { foreignKey: "userId", as: "aiConversations" });
AiConversation.belongsTo(User, { foreignKey: "userId", as: "user" });

AiConversation.hasMany(AiMessage, { foreignKey: "conversationId", as: "aiMessages" });
AiMessage.belongsTo(AiConversation, { foreignKey: "conversationId", as: "aiConversation" });

User.hasMany(LoginAttemptLog, { foreignKey: "userId", as: "loginAttemptLogs" });
LoginAttemptLog.belongsTo(User, { foreignKey: "userId", as: "user" });

export { sequelize };
