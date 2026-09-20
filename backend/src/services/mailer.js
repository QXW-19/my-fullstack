const nodemailer = require('nodemailer');
require('dotenv').config();

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;

  if (!process.env.SMTP_HOST || !process.env.SMTP_USER) {
    console.warn('⚠️  邮件未配置');
    return null;
  }

  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: +process.env.SMTP_PORT || 465,
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });

  return transporter;
}

async function sendMail({ to, subject, html, text }) {
  const t = getTransporter();
  if (!t) return { ok: false, reason: '未配置' };

  try {
    const info = await t.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to,
      subject,
      html,
      text: text || html.replace(/<[^>]+>/g, '')
    });
    console.log(`📧 邮件已发送: ${to} - ${subject}`);
    return { ok: true, messageId: info.messageId };
  } catch (e) {
    console.error('❌ 邮件发送失败:', e.message);
    return { ok: false, reason: e.message };
  }
}

function wrapTemplate({ title, content, link, linkText, emoji = '🐾' }) {
  const btn = link
    ? `<a href="${link}" style="display:inline-block;padding:12px 24px;background:#0071e3;color:#fff;text-decoration:none;border-radius:999px;font-weight:600;margin-top:20px;">${linkText || '查看详情'}</a>`
    : '';

  return `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background:#f5f5f7;font-family:-apple-system,BlinkMacSystemFont,'PingFang SC','Microsoft YaHei',sans-serif;">
  <div style="max-width:600px;margin:40px auto;background:#fff;border-radius:20px;overflow:hidden;box-shadow:0 8px 32px rgba(0,0,0,0.08);">
    <div style="padding:40px 40px 24px;text-align:center;background:linear-gradient(135deg,#667eea,#764ba2);">
      <div style="font-size:48px;margin-bottom:12px;">${emoji}</div>
      <h1 style="margin:0;color:#fff;font-size:24px;font-weight:700;">${title}</h1>
    </div>
    <div style="padding:32px 40px;">
      <div style="font-size:15px;line-height:1.7;color:#1d1d1f;">${content}</div>
      <div style="text-align:center;">${btn}</div>
    </div>
    <div style="padding:20px 40px 32px;text-align:center;border-top:1px solid #f0f0f0;">
      <p style="margin:0;font-size:12px;color:#86868b;">本邮件由「猫狗回忆录」自动发送</p>
    </div>
  </div>
</body>
</html>`;
}

// ============ 具体场景 ============

async function sendReplyNotification({ to, toName, fromName, content, link }) {
  return sendMail({
    to,
    subject: `💬 ${fromName} 回复了你的留言`,
    html: wrapTemplate({
      emoji: '💬',
      title: '有人回复了你的留言',
      content: `<p>Hi <b>${toName}</b>，</p>
        <p><b>${fromName}</b> 回复了你：</p>
        <blockquote style="margin:16px 0;padding:12px 20px;background:#f5f5f7;border-left:3px solid #0071e3;border-radius:8px;">${content}</blockquote>
        <p>快去看看吧～</p>`,
      link,
      linkText: '查看留言板'
    })
  });
}

async function sendPetHungryNotification({ to, toName, petName, hunger, link }) {
  return sendMail({
    to,
    subject: `😿 ${petName} 饿得不行了！`,
    html: wrapTemplate({
      emoji: '😿',
      title: `${petName} 饿了`,
      content: `<p>Hi <b>${toName}</b>，</p>
        <p>你的宠物 <b>${petName}</b> 已经饿得肚子咕咕叫了！</p>
        <p>当前饱食度：<b style="color:#ff9500;">${Math.round(hunger)}</b> / 100</p>
        <p>快回去喂喂它吧～</p>`,
      link,
      linkText: '去喂食'
    })
  });
}

async function sendPetDiedNotification({ to, toName, petName, cause, link }) {
  return sendMail({
    to,
    subject: `💀 ${petName} 离开了...`,
    html: wrapTemplate({
      emoji: '💀',
      title: `${petName} 离开了`,
      content: `<p>Hi <b>${toName}</b>，</p>
        <p>很遗憾，你的宠物 <b>${petName}</b> 因为 <b style="color:#ff3b30;">${cause}</b> 离开了。</p>
        <p>花 500 金币可以让它复活...</p>`,
      link,
      linkText: '去复活'
    })
  });
}

async function sendFriendHelpNotification({ to, toName, fromName, petName, action, message, link }) {
  return sendMail({
    to,
    subject: `❤️ ${fromName} 帮 ${petName} ${action}了`,
    html: wrapTemplate({
      emoji: '❤️',
      title: '有人帮你照顾宠物',
      content: `<p>Hi <b>${toName}</b>，</p>
        <p><b>${fromName}</b> 帮你的宠物 <b>${petName}</b> ${action}了！</p>
        ${message ? `<blockquote style="margin:16px 0;padding:12px 20px;background:#fff9e6;border-left:3px solid #ffcc00;border-radius:8px;">「${message}」</blockquote>` : ''}
        <p>你的宠物状态更好了～</p>`,
      link,
      linkText: '查看宠物'
    })
  });
}

async function sendWelcomeMail({ to, toName }) {
  return sendMail({
    to,
    subject: `🎉 欢迎加入猫狗回忆录`,
    html: wrapTemplate({
      emoji: '🎉',
      title: '欢迎你',
      content: `<p>Hi <b>${toName}</b>，</p>
        <p>欢迎加入「猫狗回忆录」！</p>
        <p>这里你可以：</p>
        <ul style="padding-left:20px;">
          <li>🐾 领养专属宠物</li>
          <li>💬 和它 AI 聊天</li>
          <li>🏆 解锁成就</li>
          <li>🎩 给宠物打扮</li>
        </ul>
        <p>现在就去领养第一只宠物吧～</p>`,
      link: 'http://101.37.234.235:8080/pet',
      linkText: '去领养'
    })
  });
}

module.exports = {
  sendMail,
  sendReplyNotification,
  sendPetHungryNotification,
  sendPetDiedNotification,
  sendFriendHelpNotification,
  sendWelcomeMail
};
