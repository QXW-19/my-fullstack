const router = require('express').Router();
const { Pet } = require('../models');
const { success, fail } = require('../utils/response');
const auth = require('../middlewares/auth');
const petAI = require('../services/petAI');

router.use(auth);

router.post('/send', async (req, res) => {
  try {
    const { message } = req.body;
    if (!message?.trim()) return fail(res, '消息不能为空');
    if (message.length > 200) return fail(res, '消息太长');

    const pet = await Pet.findOne({ where: { user_id: req.user.id } });
    if (!pet) return fail(res, '你还没有宠物');
    if (pet.stage === 'dead') return fail(res, '宠物已经离开了，无法对话');
    if (pet.stage === 'sick') return fail(res, '宠物生病了，不想说话');

    const reply = await petAI.chatWithPet(pet, message.trim());
    success(res, { userMessage: message.trim(), reply }, 'ok');
  } catch (e) {
    console.error('AI chat error:', e.message);
    fail(res, e.message || 'AI 服务暂时不可用');
  }
});

router.get('/history', async (req, res) => {
  try {
    const pet = await Pet.findOne({ where: { user_id: req.user.id } });
    if (!pet) return fail(res, '你还没有宠物');
    const history = await petAI.getChatHistory(pet.id, 50);
    success(res, history);
  } catch (e) { fail(res, e.message); }
});

router.delete('/history', async (req, res) => {
  try {
    const pet = await Pet.findOne({ where: { user_id: req.user.id } });
    if (!pet) return fail(res, '你还没有宠物');
    await petAI.clearChatHistory(pet.id);
    success(res, null, '聊天记录已清空');
  } catch (e) { fail(res, e.message); }
});

module.exports = router;
