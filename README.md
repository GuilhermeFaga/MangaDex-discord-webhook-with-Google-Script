
# MangaDex discord webhook with Google Script

When running the script the output will look like this:

![](https://imgur.com/92jWaXu.png)

For this to properly work it reads the RSS feed provided, then processes the data and the script then forwards it to Discord via a webhook.

#### It takes less than 15 minutes to setup everything! No need for downloads!

## Google Script setup

Prerequisites:
- A Google account

### Steps

 - Create a new Google Spreadsheet document ([sheets.new](sheets.new))

 - Add these two sheets (we'll use them later)  
![](https://imgur.com/0TYIY3k.png)

- Enter on the `Script editor`  
![](https://imgur.com/UNCgkM4.png)

- Paste all the code of `Code.gs` on the newly created `.gs`.
- Create a new script file named `helper` and paste all the code from `helper.gs` inside it.  
![](https://imgur.com/LlRvZxC.png)

- Create a `trigger`  
![](https://imgur.com/ucoVUyA.png)
![](https://imgur.com/xyLxBRb.png)
> If you chose a different time interval, don't forget to change the first line on `Code.gs`:  
![](https://imgur.com/Hhs1J6z.png)

## Discord webhook setup and sheet configuration

Prerequisites:
- A Discord account
- Have certain permissions on a server

### Steps

-  On your discord server, go to `Server Settings > Integrations` and create a new webhook:  
![](https://imgur.com/InuvbSN.png)
 - Copy the webhook url and paste it on the `webhooks` sheet  
 ![](https://imgur.com/YX8feZU.png)
 >To change it's name and avatar just edit these lines on `Code.gs`:  
 ![](https://imgur.com/DgzcMU1.png)
 
>Example:  
![](https://imgur.com/kZ7N5f5.png)  
> To have the script send it to more than one webhook, just paste others in the same column

### Manga filtering
- Just add the mangas ids on the first column on the `filters` sheet
> You can found the manga id here:  
![](https://imgur.com/DUDXEVp.png)

>Example:  
![](https://imgur.com/OXGx6aq.png)

#### After all of this is done you are good to go and have updates to your recently released manga chapters in Discord!
