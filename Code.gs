let TRIGGER_INTERVAL = 10; // in minutes
let MANGADEX_RSS = "https://mangadex.org/rss/your-rss"; // Paste here your RSS link
let WEBHOOK_NAME = "MangaDex"; // Name that the webhook will use
let AVATAR_URL = "https://mangadex.org/images/misc/default_brand.png?1"; // Avatar that the webhook will use
let WEBHOOKS_SHEET = "webhooks";
let FILTERS_SHEET = "filters";
let CURRENT_VERSION = "1.2";

var isUpdated = true;

function timerTrigger() {
  main();
}

function main() {
  checkIfScriptIsUpdated();
  let mangas = getLatestMangas();
  
  if (!mangas) return;
  
  for (var i = 0; i < mangas.length; i++) {
    let manga = mangas[i];
    
    sendMangaToWebhook(manga);
  }
}

function checkIfScriptIsUpdated(){
  let url = "https://api.github.com/repos/GuilhermeFaga/MangaDex-discord-webhook-with-Google-Script/releases"
  let latestVersion = request(url, "GET")[0];
  
  if (latestVersion.name > CURRENT_VERSION) isUpdated = false;
}

function getLatestMangas(){
  
  let mangaUrl = "https://mangadex.org/api/manga/";
  
  let response = request(MANGADEX_RSS, "GET", null, false);
  
  let regex = new RegExp(/<item>(.+?)<\/item>/sg);
  
  let mangaWhitelist = getArrayFromSheets(FILTERS_SHEET, 1);
  
  if (!regex.test(response)) return null;
  
  let items = response.match(/<item>(.+?)<\/item>/sg);
  
  var mangas = [];
  for (let i = 0; i < items.length; i++) {
    let item = items[i];
    if (!item) continue;
    
    var manga = {
      date:  new Date(item.match(/<pubDate>(.+?)<\/pubDate>/s)[1]),
      manga_link: item.match(/<mangaLink>(.+?)<\/mangaLink>/s)[1],
      id: item.match(/<mangaLink>(.+?)<\/mangaLink>/s)[1].match(/title\/(.+)/)[1]
    };
    
    if (!(mangaIsNew(manga) && (!mangaWhitelist || mangaWhitelist.contains(manga.id)))) continue;
    
    var mangaDetails = request(mangaUrl + manga.id, "GET")["manga"];
    manga["link"] = item.match(/<link>(.+?)<\/link>/s)[1];
    manga["title"] = item.match(/<title>(.+?)<\/title>/s)[1];
    
    try {
      manga["title"] = manga.title.match(/.+ - (.+)/)[1];
    } catch (e) {
      console.log(manga.title);
      console.log(e);
    }
    
    var isDuplicated = false;
    
    for (let j = 0; j < mangas.length; j++) {
      const _manga = mangas[j];
      if (_manga.id != manga.id) continue;
      if (!_manga["chapters"]) _manga["chapters"] = [];
      _manga["chapters"].push(`[${manga.title}](${manga.link})\n`);
      //      _manga.description = `[${manga.title}](${manga.link})\n` + _manga.description;
      isDuplicated = true;
      break;
    }
    
    if (isDuplicated) continue;
    
    manga["description"] = item.match(/<description>(.+?)<\/description>/s)[1].replace(/\s-\s/g, "\n");
    manga["manga_title"] = mangaDetails["title"] ? mangaDetails["title"] : "";
    manga["artist"] = mangaDetails["artist"] ? mangaDetails["artist"] : "";
    manga["author"] = mangaDetails["author"] ? mangaDetails["author"] : "";
    manga["lang"] = mangaDetails["lang_name"] ? mangaDetails["lang_name"] : "";
    if (mangaDetails["links"])
      manga["mal"] = mangaDetails["links"]["mal"] ? "https://myanimelist.net/manga/" + mangaDetails["links"]["mal"] : "";
    manga["cover_url"] = mangaDetails["cover_url"] ? "https://mangadex.org" + mangaDetails["cover_url"] : "";
    if (mangaDetails["rating"]){
      manga["rating"] = mangaDetails["rating"]["bayesian"] ? mangaDetails["rating"]["bayesian"] : "";
      manga["users"] = mangaDetails["rating"]["users"] ? mangaDetails["rating"]["users"] : "";
    }
    mangas.push(manga);
  }
  return mangas.reverse();
}

function mangaIsNew(manga){
  let diff = Math.abs((new Date() - manga.date)/60000);
  if (diff > TRIGGER_INTERVAL) return false;
  return true;
}

function sendMangaToWebhook(manga){
  
  let webhooks = getArrayFromSheets(WEBHOOKS_SHEET, 1);
  
  let mangaWhitelist = getArrayFromSheets(FILTERS_SHEET);
  
  var role = "";
  if (mangaWhitelist) {
    for (var i = 0; i < mangaWhitelist.length; i++){
      if(mangaWhitelist[i][0] == manga.id && mangaWhitelist[i][1]){
        role += "<@&" + mangaWhitelist[i][1] + ">";
      }
    }
  }
  
  if (!webhooks) return;
  
  var preDesc = "";
  var desc = "\n\n**------ Manga details ------**\n\n";
  
  if (manga["artist"]) desc += `**Artist:** ${manga.artist}\n`;
  if (((manga["author"] && manga["artist"]) && (manga["author"] != manga["artist"])) 
    || manga["author"] && !manga["artist"]) desc += `**Author:** ${manga.author}\n`; 
  if (manga["lang"]) desc += `**Language:** ${manga.lang}\n`;
  if (manga["mal"]) desc += `[View on MAL](${manga.mal})\n`;
  if (manga["rating"]) desc += `\n**Rating:** ${manga.rating} (${manga.users} reviews)`;
  if (manga["chapters"]) preDesc = manga["chapters"].join("") + "\n";
  
  
  let payload = {
    "embeds": [
      {
        "title": manga.title,
        "description": preDesc + manga.description + desc,
        "url": manga.link,
        "color": 16742144,
        "author": {
          "name": manga.manga_title,
          "url": manga.manga_link
        },
        "footer": {
          "text": isUpdated ? "" : "New update available"
        },
        "timestamp": manga.date,
        "thumbnail": {
          "url": manga.cover_url
        }
      }
    ],
    "username": WEBHOOK_NAME,
    "avatar_url": AVATAR_URL,
    "content": role
  };
  
  webhooks.map(webhook => request(webhook, "POST", payload));
}