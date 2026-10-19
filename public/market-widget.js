// Official embed: https://goldprice.org/gold-price-charts.html
// Keep the supplier attribution. No scraping, proxying or numeric extraction.
const silver=new URLSearchParams(location.search).get('metal')==='silver';
const metal=silver?'silver':'gold',credit=document.getElementById('credit'),status=document.getElementById('status');
credit.textContent=silver?'Silver Price':'Gold Price';credit.href=silver?'https://silverprice.org/':'https://goldprice.org/';
document.getElementById('fallback').href=silver?'https://silverprice.org/silver-price-colombia.html':'https://goldprice.org/gold-price-colombia.html';
const chart=document.getElementById('chart'),container=document.createElement('div');container.id=metal+'-price';container.setAttribute('data-'+metal+'_price','COP-o-1d');chart.append(container);
const script=document.createElement('script');script.src='https://charts.goldprice.org/'+metal+'-price.js';script.async=true;
let complete=false;
function failed(){if(complete)return;status.textContent='No se pudo confirmar la carga. Consulta la gráfica directamente en el proveedor.'}
// Script load alone is not evidence of a fresh market price; observe rendered images.
function watchImages(){for(const img of chart.querySelectorAll('img')){if(img.dataset.mineryObserved)continue;img.dataset.mineryObserved='1';const loaded=()=>{if(!img.naturalWidth)return;complete=true;clearTimeout(timeout);status.textContent='Gráfica externa cargada. La fecha y hora válidas son las que muestra el proveedor.'};img.addEventListener('load',loaded);img.addEventListener('error',failed);if(img.complete)loaded()}}
const observer=new MutationObserver(watchImages);observer.observe(chart,{childList:true,subtree:true});
const timeout=setTimeout(failed,15000);script.onerror=failed;script.onload=watchImages;document.body.append(script);
addEventListener('pagehide',()=>{clearTimeout(timeout);observer.disconnect()});
