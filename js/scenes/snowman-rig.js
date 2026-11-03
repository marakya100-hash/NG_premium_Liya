/* Registered wardrobe: one illustration, one coordinate system, curved anatomical contours.
   Garments are revealed in place. No stretching or independently scaled garment bitmaps. */
const NS='http://www.w3.org/2000/svg';
const source=new URL('../../assets/art/snowman-dressed.webp',import.meta.url).href;
const base=new URL('../../assets/art/snowman-base-v3.webp',import.meta.url).href;
const contours={
 hat:'M260 0 H850 V310 L766 305 C745 271 712 239 672 225 C566 237 471 274 430 326 C404 367 391 425 414 477 L307 480 L280 410 L280 300 L245 250 V0 Z',
 scarf:'M393 475 C481 509 675 511 752 461 C765 450 769 428 779 416 C813 420 838 451 835 479 C853 499 860 522 841 542 C817 566 766 585 711 593 C665 602 609 605 573 596 L570 722 C566 782 547 860 519 905 L497 974 C453 992 399 976 366 964 L296 940 L251 917 L222 884 L197 812 L195 779 L260 761 L311 714 L350 659 L378 597 L381 568 L365 558 C374 534 378 499 393 475 Z',
 'left-mitten':'M57 400 H284 L296 482 C329 491 349 511 348 538 C350 577 333 620 302 639 C267 662 218 674 181 652 C156 632 157 609 167 586 C124 574 81 553 66 510 Z',
 'right-mitten':'M931 557 C956 550 979 568 991 574 C1049 567 1066 606 1068 650 C1074 690 1051 729 1012 745 L988 749 L986 722 C1005 719 1017 711 1025 704 C989 734 943 721 920 703 C906 692 904 673 911 646 L910 609 C910 583 917 568 931 557 Z',
 carrot:'M587 340 C600 331 623 338 647 333 L717 319 C728 332 695 351 680 364 C659 384 641 403 616 403 C587 403 580 370 587 340 Z',
 vest:'M572 592 C632 602 703 599 751 582 L808 536 C833 542 846 563 851 602 L879 708 L907 778 L912 808 C907 830 871 847 848 856 C806 842 763 813 718 781 C683 807 656 834 618 854 C589 873 534 857 485 840 L485 817 C519 811 541 800 550 785 L559 739 L564 677 L572 592 Z',
 broom:'M925 54 H1254 V555 L1080 566 L1017 545 L999 580 L977 719 L914 1118 L866 1118 L933 716 L952 574 L963 532 L903 518 L871 461 L876 384 L901 305 Z'
};
const order=['broom','vest','scarf','hat','carrot','left-mitten','right-mitten'];
function node(tag,attrs={}){const e=document.createElementNS(NS,tag);for(const [k,v] of Object.entries(attrs))e.setAttribute(k,String(v));return e;}
export function createSnowmanRig(){
 const svg=node('svg',{viewBox:'0 0 1254 1254',class:'snowman-rig','aria-hidden':'true',preserveAspectRatio:'xMidYMid meet'});
 const defs=node('defs'),prefix='wardrobe-'+Math.random().toString(36).slice(2),body=node('image',{href:base,width:1254,height:1254,class:'rig-base'});svg.append(defs);
 const colorKey=node('filter',{id:prefix+'-vest-key','color-interpolation-filters':'sRGB',x:'0%',y:'0%',width:'100%',height:'100%'});colorKey.append(node('feColorMatrix',{type:'matrix',values:'1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  -4 7 0 0 .8'}));const threshold=node('feComponentTransfer');threshold.append(node('feFuncA',{type:'discrete',tableValues:'0 0 1 1'}));colorKey.append(threshold,node('feComposite',{in2:'SourceAlpha',operator:'in'}));defs.append(colorKey);const layers=new Map();
 for(const key of order){const id=prefix+'-'+key,clip=node('clipPath',{id,clipPathUnits:'userSpaceOnUse'});clip.append(node('path',{d:contours[key],'clip-rule':'evenodd','fill-rule':'evenodd'}));defs.append(clip);const g=node('g',{class:'registered-garment',opacity:0});if(key==='vest'){const backingClip=node('clipPath',{id:prefix+'-vest-backing',clipPathUnits:'userSpaceOnUse'});backingClip.append(node('path',{d:'M395 515 H578 L572 592 L564 677 L564 712 H685 V890 H395 Z'}));defs.append(backingClip);g.append(node('image',{href:new URL('../../assets/art/snowman-vest.webp',import.meta.url).href,x:409,y:522,width:505,height:340,preserveAspectRatio:'none','clip-path':`url(#${prefix}-vest-backing)`}));}const clipped=node('g',{'clip-path':`url(#${id})`});const texture=node('image',{href:source,width:1254,height:1254});if(key==='vest'||key==='right-mitten'){const exclude=node('mask',{id:prefix+'-exclude-'+key,maskUnits:'userSpaceOnUse',x:0,y:0,width:1254,height:1254});exclude.append(node('rect',{width:1254,height:1254,fill:'white'}),node('path',{d:key==='vest'?'M490 712 H685 V875 H490 Z':'M932 713 L966 718 L960 760 L928 760 Z',fill:'black'}));defs.append(exclude);texture.setAttribute('mask',`url(#${prefix}-exclude-${key})`);}if(key==='vest')texture.setAttribute('filter',`url(#${prefix}-vest-key)`);clipped.append(texture);g.append(clipped);svg.append(g);if(key==='broom')svg.append(body);layers.set(key,g);}
 const finish=node('image',{href:source,width:1254,height:1254,class:'rig-finish',opacity:0});svg.append(finish);
 return {element:svg,wear(key){const layer=layers.get(key);if(layer){layer.setAttribute('opacity','1');layer.classList.add('garment-arrived');}},finish(){svg.classList.add('rig-complete');finish.setAttribute('opacity','1');}};
}
