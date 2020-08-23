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
    
    sendMangaToWebhook(manga);
  }
}

function getLatestMangas(){
  
  let url = "https://mangadex.org/rss/QbWK2U7SFDuVtvfxGnMeRNdPcarTYq59";
  let mangaUrl = "https://mangadex.org/api/manga/";
  
  let response = request(url, "GET", null, false);
  
  let regex = new RegExp(/<item>(.+?)<\/item>/sg);
  
  let mangaWhitelist = getArrayFromSheets(FILTERS_SHEET);
  
  if (regex.test(response)){
    let items = response.match(/<item>(.+?)<\/item>/sg);
    var mangas = [];
    items.map(function(item){
      let manga = {
        title: item.match(/<title>(.+?)<\/title>/s)[1],
        link: item.match(/<link>(.+?)<\/link>/s)[1],
        manga_link: item.match(/<mangaLink>(.+?)<\/mangaLink>/s)[1],
        date: new Date(item.match(/<pubDate>(.+?)<\/pubDate>/s)[1]),
        description: item.match(/<description>(.+?)<\/description>/s)[1].replace(/\s-\s/g, "\n"),
        id: item.match(/<mangaLink>(.+?)<\/mangaLink>/s)[1].match(/title\/(.+)/)[1]
      };
      if (mangaIsNew(manga) && (!mangaWhitelist || mangaWhitelist.contains(manga.id))) {
        var mangaDetails = request(mangaUrl + manga.id, "GET")["manga"];
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
    });
    return mangas.reverse();
  }
  return null;
}

function mangaIsNew(manga){
  let diff = Math.abs((new Date() - manga.date)/60000);
  if (diff > TRIGGER_INTERVAL) return false;
  return true;
}

function sendMangaToWebhook(manga){
  
  let webhooks = getArrayFromSheets(WEBHOOKS_SHEET);
  
  console.log(webhooks);
  
  if (!webhooks) return;
  
  var desc = "\n\n**------Manga details------**\n\n";
  
  if (manga["artist"]) desc += `**Artist:** ${manga.artist}\n`;
  if (((manga["author"] && manga["artist"]) && (manga["author"] != manga["artist"])) 
    || manga["author"] && !manga["artist"]) desc += `**Author:** ${manga.author}\n`; 
  if (manga["lang"]) desc += `**Language:** ${manga.lang}\n`;
  if (manga["mal"]) desc += `[View on MAL](${manga.mal})\n`;
  if (manga["rating"]) desc += `\n**Rating:** ${manga.rating} (${manga.users} reviews)`;
  
  let payload = {
    "embeds": [
      {
        "title": manga.title.match(/.+ - (.+)/)[1],
        "description": manga.description + desc,
        "url": manga.link,
        "color": 16742144,
        "author": {
          "name": manga.manga_title,
          "url": manga.manga_link
        },
        "timestamp": manga.date,
        "thumbnail": {
          "url": manga.cover_url
        }
      }
    ],
    "username": "MangaDex",
    "avatar_url": "https://mangadex.org/images/misc/default_brand.png?1"
  };
  
  webhooks.map(webhook => request(webhook, "POST", payload));
}