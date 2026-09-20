/**
 * 宠物皮肤配置
 * 每个皮肤对应一个 emoji 和名称
 */
const SKINS = {
  cat: [
    { id: 'default',  name: '橘猫',   emoji: '🐱', price: 0 },
    { id: 'white',    name: '白猫',   emoji: '🐈', price: 100 },
    { id: 'black',    name: '黑猫',   emoji: '🐈‍⬛', price: 100 },
    { id: 'kitten',   name: '小猫',   emoji: '🐈', price: 200 },
    { id: 'golden',   name: '金渐层', emoji: '🐯', price: 500 }
  ],
  dog: [
    { id: 'default',  name: '柴犬',   emoji: '🐶', price: 0 },
    { id: 'shiba',    name: '秋田',   emoji: '🐕', price: 100 },
    { id: 'corgi',    name: '柯基',   emoji: '🦮', price: 200 },
    { id: 'husky',    name: '哈士奇', emoji: '🐺', price: 300 },
    { id: 'puppy',    name: '幼犬',   emoji: '🐕', price: 500 }
  ],
  dragon: [
    { id: 'default',  name: '青龙',   emoji: '🐉', price: 0 },
    { id: 'red',      name: '红龙',   emoji: '🐲', price: 200 },
    { id: 'gold',     name: '金龙',   emoji: '🐉', price: 500 }
  ],
  rabbit: [
    { id: 'default',  name: '白兔',   emoji: '🐰', price: 0 },
    { id: 'brown',    name: '灰兔',   emoji: '🐇', price: 100 },
    { id: 'pink',     name: '粉兔',   emoji: '🐇', price: 200 }
  ],
  panda: [
    { id: 'default',  name: '熊猫',   emoji: '🐼', price: 0 },
    { id: 'baby',     name: '幼崽',   emoji: '🐼', price: 200 },
    { id: 'cub',      name: '大熊',   emoji: '🐻', price: 300 }
  ]
};

module.exports = { SKINS };
