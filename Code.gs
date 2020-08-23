let TRIGGER_INTERVAL = 10; // in minutes
let WEBHOOKS_SHEET = "webhooks";
let FILTERS_SHEET = "filters";

function timerTrigger() {
  main();
}

function main() {
  let mangas = getLatestMangas();
  
  for (var i = 0; i < mangas.length; i++) {
    let manga = mangas[i];
    if (!mangaIsNew(manga)) continue;
    
    sendMangaToWebhook(manga);
  }
}

function getLatestMangas(){
  
  let url = "https://mangadex.org/rss/QbWK2U7SFDuVtvfxGnMeRNdPcarTYq59";
  
  let response = request(url, "GET");
  
  let regex = new RegExp(/<item>(.+?)<\/item>/sg);
  
  let mangaWhitelist = getArrayFromSheets(FILTERS_SHEET);
  
  if (regex.test(response)){
    let items = response.match(/<item>(.+?)<\/item>/sg);
    var mangas = [];
    items.map(function(item){
      let manga = {
        title: item.match(/<title>(.+?)<\/title>/s)[1],
        link: item.match(/<link>(.+?)<\/link>/s)[1],
        mangaLink: item.match(/<mangaLink>(.+?)<\/mangaLink>/s)[1],
        date: new Date(item.match(/<pubDate>(.+?)<\/pubDate>/s)[1]),
        description: item.match(/<description>(.+?)<\/description>/s)[1].replace(/\s-\s/g, "\n"),
        id: item.match(/<mangaLink>(.+?)<\/mangaLink>/s)[1].match(/title\/(.+)/)[1]
      };
      if (!mangaWhitelist || mangaWhitelist.contains(manga.id))
        mangas.push(manga);
    });
    return mangas.reverse();
  }
  return null;
}

function mangaIsNew(manga){
  let diff = Math.abs((new Date() - manga.date)/60000)
  if (diff > TRIGGER_INTERVAL) return false;
  return true;
}

function sendMangaToWebhook(manga){
  
  let webhooks = getArrayFromSheets(WEBHOOKS_SHEET);
  
  console.log(webhooks);
  
  if (!webhooks) return;
  
  let payload = {
    "embeds": [
      {
        "title": manga.title,
        "description": manga.description,
        "url": manga.link,
        "color": 16742144,
        "footer": {
          "text": ""
        },
        "timestamp": manga.date,
        "thumbnail": {
          "url": `https://mangadex.org/images/manga/${manga.id}.jpg`
        }
      }
    ],
    "username": "MangaDex",
    "avatar_url": "https://mangadex.org/images/misc/default_brand.png?1"
  }
  
  webhooks.map(webhook => request(webhook, "POST", payload));
}