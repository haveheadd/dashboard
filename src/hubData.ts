import type { ImportedTask } from './importProject';
import {summerAssets} from './summerAssets';

export type WikiPage={id:string;title:string;content:string[]};
export type Asset={id:string;name:string;type:string;status:'Готово'|'В работе'|'Не найден';figmaUrl?:string;taskIds:string[];wikiIds:string[];owner?:string;deadline?:string};
export type Source={id:string;kind:'gantt'|'description'|'figma'|'assets';name:string;status:string;updated:string};
export type Project={id:string;name:string;emoji:string;description:string;deadline:string;progress:number;updated:string;archived?:boolean;tasks:ImportedTask[];wiki:WikiPage[];assets:Asset[];sources:Source[];figmaUrl?:string};

const tasks:ImportedTask[]=[
 {id:1,title:'Финализировать механику',stage:'Концепция',color:'#7657e8',start:0,span:4,owner:'Света',initials:'С',status:'Готово',progress:100},
 {id:2,title:'Подготовить лендинг',stage:'Дизайн',color:'#ff756d',start:3,span:6,owner:'Вера',initials:'В',status:'В работе',progress:72},
 {id:3,title:'Собрать подарок «Гном»',stage:'Контент',color:'#f1b63e',start:6,span:5,owner:'Даня',initials:'Д',status:'В работе',progress:55},
 {id:4,title:'Настроить выдачу наград',stage:'Разработка',color:'#4f8df7',start:10,span:7,owner:'Ян',initials:'Я',status:'Не начато',progress:0},
 {id:5,title:'Провести QA',stage:'Запуск',color:'#28b684',start:17,span:4,owner:'Лёля',initials:'Л',status:'Не начато',progress:0},
];

export const demoProjects:Project[]=[
 {id:'summer-camp',name:'Летний лагерь Blink',emoji:'🏕️',description:'Спецпроект с заданиями, наградами и игровым ларьком',deadline:'2026-08-20',progress:84,updated:'сегодня, 14:32',tasks,wiki:[
  {id:'about',title:'О проекте',content:['Спецпроект в сеттинге летнего лагеря Blink. Пользователи выполняют задания, получают фантики и обменивают их на награды.']},
  {id:'goals',title:'Цели',content:['Рост stickiness аудитории через ежедневные задания и использование ключевых функций продукта.']},
  {id:'mechanics',title:'Механика',content:['Дни 1–8 — задания и приглашения. День 9 — уникальные тряхи. День 10 — итоги и антифрод. День 11 — открытие ларька.']},
  {id:'qa',title:'QA',content:['Проверить точки входа, лендинг, задания, карту, бесплатные предметы, ачивки и выдачу призов.']},
 ],assets:summerAssets,sources:[
  {id:'g1',kind:'gantt',name:'Summer camp.xlsx',status:'37 задач · подключено',updated:'сегодня, 14:32'},
  {id:'d1',kind:'description',name:'Летний лагерь Blink.docx',status:'Вики создана',updated:'вчера'},
  {id:'f1',kind:'figma',name:'Vera / Summer Camp',status:'Ссылка добавлена · нужен OAuth',updated:'вчера'},
  {id:'a1',kind:'assets',name:'Реестр ассетов из описания проекта',status:`${summerAssets.length} материалов`,updated:'сейчас'},
 ],figmaUrl:'https://www.figma.com/design/kiH09ERBPVpQQ3vowgf42D/Vera'},
 {id:'hexes',name:'Гексы',emoji:'🗺️',description:'Развитие механики аренды гексов в Blink',deadline:'2026-09-15',progress:37,updated:'вчера, 18:10',tasks:[],wiki:[],assets:[],sources:[]},
 {id:'halloween',name:'Halloween Event',emoji:'🎃',description:'Осенняя рекламная кампания',deadline:'2026-10-31',progress:12,updated:'3 дня назад',tasks:[],wiki:[],assets:[],sources:[]},
];
