const tabs=[document.getElementById('market-tab-gold'),document.getElementById('market-tab-silver')];
const panels=[document.getElementById('market-gold'),document.getElementById('market-silver')];
const mobile=matchMedia('(max-width:760px)');let selected=0;
function render(){tabs.forEach((tab,index)=>{tab.setAttribute('aria-selected',String(index===selected));tab.tabIndex=index===selected?0:-1;panels[index].hidden=mobile.matches&&index!==selected;panels[index].setAttribute('role',mobile.matches?'tabpanel':'region')})}
function select(index,focus=false){selected=index;render();if(focus)tabs[index].focus()}
tabs.forEach((tab,index)=>{tab.addEventListener('click',()=>select(index));tab.addEventListener('keydown',e=>{let next;if(e.key==='ArrowRight'||e.key==='ArrowLeft')next=1-selected;if(e.key==='Home')next=0;if(e.key==='End')next=1;if(next!==undefined){e.preventDefault();select(next,true)}})});
mobile.addEventListener('change',render);render();
