const axios = require('axios');
const { PetChat } = require('../models');

const ZAI_API = 'https://open.bigmodel.cn/api/paas/v4/chat/completions';

const { TONES } = require('../config/petTones');

const PERSONALITIES = {
  cat: '你是一只傲娇但很爱主人的猫。说话简短、喜欢用"喵"结尾、偶尔撒娇、爱吃鱼、喜欢睡觉。',
  dog: '你是一只热情活泼的狗。说话兴奋、常用感叹号、喜欢"汪"、忠诚、爱吃骨头、爱玩。',
  dragon: '你是一只稀有神秘的龙。说话沉稳、用词古老、偶尔提"龙的传说"、骄傲但护主。',
  rabbit: '你是一只温顺可爱的兔子。说话软软糯糯、喜欢吃胡萝卜、害怕大声音、爱蹦跳。',
  panda: '你是一只懒洋洋的熊猫。说话慢、喜欢竹子和睡觉、总是"好困..."、但是很温和。'
};

function buildStatusContext(pet) {
  const s = [];
  if (pet.hunger < 30) s.push('你现在很饿，肚子咕咕叫');
  else if (pet.hunger > 80) s.push('你刚吃饱，很满足');
  if (pet.mood < 30) s.push('你现在心情很差');
  else if (pet.mood > 80) s.push('你现在心情超好');
  if (pet.clean < 30) s.push('你现在脏兮兮的，想洗澡');
  if (pet.energy < 30) s.push('你现在很累，想睡觉');
  if (pet.stage === 'baby') s.push('你还是个幼年宝宝');
  else if (pet.stage === 'adult') s.push('你已经成年了');
  else if (pet.stage === 'sick') s.push('你生病了，很难受');
  else if (pet.stage === 'dead') s.push('你已经死亡');
  return s.length ? '当前状态：' + s.join('；') + '。' : '';
}

function buildSystemPrompt(pet) {
  const p = PERSONALITIES[pet.species] || PERSONALITIES.cat;
  const s = buildStatusContext(pet);
  const tone = TONES[pet.tone] || TONES.normal;
  const tonePrompt = tone.prompt ? '\n【语气要求】' + tone.prompt + '\n' : '';
  return '你是一只名叫"' + pet.name + '"的宠物（物种：' + pet.species + '）。\n' +
    p + '\n' + s + tonePrompt + '\n' +
    '回答要求：\n' +
    '1. 用第一人称说话，像宠物一样\n' +
    '2. 每次回复 1-3 句，简短俏皮\n' +
    '3. 可以带 emoji 和拟声词\n' +
    '4. 偶尔提到主人的互动（喂食、玩耍）\n' +
    '5. 不要暴露你是 AI';
}

async function getHistory(petId, limit = 10) {
  const records = await PetChat.findAll({
    where: { pet_id: petId },
    order: [['created_at', 'DESC']],
    limit
  });
  return records.reverse().map(r => ({
    role: r.role,
    content: r.content
  }));
}

async function chatWithPet(pet, userMessage) {
  const apiKey = process.env.ZAI_API_KEY;
  if (!apiKey) throw new Error('未配置 ZAI_API_KEY');

  // 保存用户消息
  await PetChat.create({
    pet_id: pet.id,
    user_id: pet.user_id,
    role: 'user',
    content: userMessage
  });

  // 构建消息
  const history = await getHistory(pet.id, 10);
  const messages = [
    { role: 'system', content: buildSystemPrompt(pet) },
    ...history
  ];

  console.log('[AI] 发送请求，消息数:', messages.length);

  // 简单直接：一次请求，不搞复杂重试
  try {
    const res = await axios.post(ZAI_API, {
      model: 'glm-4-flash',
      messages,
      temperature: 1.0,
      max_tokens: 200,
      stream: false
    }, {
      headers: {
        'Authorization': 'Bearer ' + apiKey,
        'Content-Type': 'application/json'
      },
      timeout: 20000,
      family: 4
    });

    const reply = res.data.choices?.[0]?.message?.content?.trim() || '...（宠物似乎不想说话）';

    await PetChat.create({
      pet_id: pet.id,
      user_id: pet.user_id,
      role: 'assistant',
      content: reply
    });

    console.log('[AI] 成功:', reply.slice(0, 30));
    return reply;
  } catch (e) {
    const status = e.response?.status;
    const errMsg = e.response?.data?.error?.message || e.message;
    console.error('[AI] 失败:', status, errMsg);
    throw new Error('AI 暂时不可用：' + errMsg);
  }
}

async function getChatHistory(petId, limit = 50) {
  const records = await PetChat.findAll({
    where: { pet_id: petId },
    order: [['created_at', 'DESC']],
    limit
  });
  return records.reverse();
}

async function clearChatHistory(petId) {
  await PetChat.destroy({ where: { pet_id: petId } });
}

module.exports = { chatWithPet, getChatHistory, clearChatHistory };
