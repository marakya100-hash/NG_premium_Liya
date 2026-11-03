export async function loadConfig() {
  await new Promise((resolve,reject)=>{
    const s=document.createElement('script');
    s.src=`config.js?v=${Date.now()}`;s.onload=resolve;s.onerror=()=>reject(new Error('Не удалось загрузить config.js. Проверьте, что файл находится рядом с index.html.'));
    document.head.append(s);
  });
  const c=window.STORY_CONFIG;
  if(!c||c.schemaVersion!==1)throw new Error('Проверьте config.js: нужен объект window.STORY_CONFIG и schemaVersion: 1.');
  for(const k of ['storyId','childName','childPhoto','parentGreeting','parentSignature','giftMessage'])if(typeof c[k]!=='string'||!c[k].trim())throw new Error(`В config.js заполните поле ${k}.`);
  if(!Number.isFinite(c.childAge)||c.childAge<5||c.childAge>9)throw new Error('В config.js укажите childAge от 5 до 9.');
  if(!Number.isInteger(c.celebrationYear))throw new Error('В config.js укажите год celebrationYear числом.');
  if(c.difficulty&&!['auto','easy','standard'].includes(c.difficulty))throw new Error('difficulty: auto, easy или standard.');
  return {...c,contentVersion:String(c.contentVersion||'1'),childGender:['boy','girl','neutral'].includes(c.childGender)?c.childGender:'neutral',photoPosition:/^\d{1,3}% \d{1,3}%$/.test(c.photoPosition||'')?c.photoPosition:'50% 40%',favoriteColor:/^#[0-9a-f]{6}$/i.test(c.favoriteColor||'')?c.favoriteColor:'#B793DA'};
}
