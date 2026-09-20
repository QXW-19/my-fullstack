const sequelize = require('../config/db');

// ============ 引入所有模型 ============
const User = require('./user');
const Message = require('./message');
const MessageLike = require('./messageLike');
const Todo = require('./todo');
const Article = require('./article');
const Tag = require('./tag');
const ArticleTag = require('./articleTag');
const Bill = require('./bill');
const BillCategory = require('./billCategory');
const Conversation = require('./conversation');
const ChatMessage = require('./chatMessage');
const Notification = require('./notification');
const Pet = require('./pet');
const PetAction = require('./petAction');
const PetItem = require('./petItem');
const PetInventory = require('./petInventory');
const PetCoinLog = require('./petCoinLog');
const PetAchievement = require('./petAchievement');
const PetUserAchievement = require('./petUserAchievement');
const PetVisit = require('./petVisit');
const PetDecoration = require('./petDecoration');
const PetOwnedDecoration = require('./petOwnedDecoration');
const PetChat = require('./petChat');
const PetDiary = require('./petDiary');

// ============ 基础关联 ============
Message.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
MessageLike.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
Todo.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
Article.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// ============ 文章-标签 多对多 ============
Article.belongsToMany(Tag, {
  through: ArticleTag,
  foreignKey: 'article_id',
  otherKey: 'tag_id',
  as: 'tags'
});
Tag.belongsToMany(Article, {
  through: ArticleTag,
  foreignKey: 'tag_id',
  otherKey: 'article_id',
  as: 'articles'
});

// ============ 账单关联 ============
Bill.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
Bill.belongsTo(BillCategory, { foreignKey: 'category_id', as: 'category' });
BillCategory.hasMany(Bill, { foreignKey: 'category_id', as: 'bills' });

// ============ 聊天关联 ============
Conversation.hasMany(ChatMessage, { foreignKey: 'conversation_id', as: 'messages' });
ChatMessage.belongsTo(Conversation, { foreignKey: 'conversation_id', as: 'conversation' });
ChatMessage.belongsTo(User, { foreignKey: 'from_id', as: 'fromUser' });
ChatMessage.belongsTo(User, { foreignKey: 'to_id', as: 'toUser' });

// ============ 通知关联 ============
Notification.belongsTo(User, { foreignKey: 'from_user_id', as: 'fromUser' });

// ============ ⭐ 宠物核心关联 ============
// Pet 属于 User（关键！）
Pet.belongsTo(User, { foreignKey: 'user_id', as: 'owner' });
User.hasOne(Pet, { foreignKey: 'user_id', as: 'pet' });

// 宠物行为
Pet.hasMany(PetAction, { foreignKey: 'pet_id', as: 'actions' });
PetAction.belongsTo(Pet, { foreignKey: 'pet_id', as: 'pet' });

// 宠物背包
PetInventory.belongsTo(Pet, { foreignKey: 'pet_id', as: 'pet' });
PetInventory.belongsTo(PetItem, { foreignKey: 'item_id', as: 'item' });
Pet.hasMany(PetInventory, { foreignKey: 'pet_id', as: 'inventory' });

// 金币日志
PetCoinLog.belongsTo(Pet, { foreignKey: 'pet_id', as: 'pet' });

// 成就
PetUserAchievement.belongsTo(Pet, { foreignKey: 'pet_id', as: 'pet' });
PetUserAchievement.belongsTo(PetAchievement, { foreignKey: 'achievement_id', as: 'achievement' });
Pet.hasMany(PetUserAchievement, { foreignKey: 'pet_id', as: 'achievements' });

// 互访
PetVisit.belongsTo(Pet, { foreignKey: 'pet_id', as: 'pet' });
PetVisit.belongsTo(User, { foreignKey: 'visitor_id', as: 'visitor' });
Pet.hasMany(PetVisit, { foreignKey: 'pet_id', as: 'visits' });

// 装扮
PetOwnedDecoration.belongsTo(Pet, { foreignKey: 'pet_id', as: 'pet' });
PetOwnedDecoration.belongsTo(PetDecoration, { foreignKey: 'decoration_id', as: 'decoration' });
Pet.hasMany(PetOwnedDecoration, { foreignKey: 'pet_id', as: 'decorations' });

// AI 聊天
PetChat.belongsTo(Pet, { foreignKey: 'pet_id', as: 'pet' });
Pet.hasMany(PetChat, { foreignKey: 'pet_id', as: 'chats' });

// 日记关联
PetDiary.belongsTo(Pet, { foreignKey: 'pet_id', as: 'pet' });
Pet.hasMany(PetDiary, { foreignKey: 'pet_id', as: 'diaries' });

// ============ 导出 ============
module.exports = {
  sequelize,
  User,
  Message,
  MessageLike,
  Todo,
  Article,
  Tag,
  ArticleTag,
  Bill,
  BillCategory,
  Conversation,
  ChatMessage,
  Notification,
  Pet,
  PetAction,
  PetItem,
  PetInventory,
  PetCoinLog,
  PetAchievement,
  PetUserAchievement,
  PetVisit,
  PetDecoration,
  PetOwnedDecoration,
  PetChat, PetDiary
};
