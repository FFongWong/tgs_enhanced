# tgs_enhanced
An enhanced version of u/SarahEiha's TGS, a simple webm library viewer and player found here:  
https://www.reddit.com/r/VAMscenes/comments/bt1nl0/tool_local_webm_player_for_web_browser/

TGS is a small, lightweight NodeJS/Express based local web application that lets you browse and play your local collection of videos in a browser window. While it's functional (and perhaps even useful!) as a general tool for browsing your video library, it's designed around the use case of using a web browser in VAM (such as [this one](https://www.reddit.com/r/VAMscenes/comments/c47698/easy_to_use_webplayer_i_wanted_to_share/)) or any other such tool to bring your video library into your virtual environments in a way that's easy to interact with. 

**Screenshots**

**Download**

*MEGA*: 

*GitHub*: https://github.com/FFongWong/tgs_enhanced

Note: if you clone/download from GitHub, you'll need to manually create the public/Videos and public/Thumbnails directories.


Here's the documentation for the original project from u/SarahEiha

>I made a small app in Express to host a local web app that you can use to watch your local WebM collection in VAM using the web browser. I recommend being familiar with using the command line but the knowledge is not necessary.
>
>**Prerequisites**
>
> Install NodeJS ( [https://nodejs.org/dist/v10.15.3/node-v10.15.3-x64.msi](https://nodejs.org/dist/v10.15.3/node-v10.15.3-x64.msi) )
>
>**Instructions**
>
>    1   Download tgs.zip and extract it somewhere.
>
>    2   Open the tgs folder.
>
>    3   Shift + Right click somewhere inside the folder and click "Open Powershell window here".
>
>    4   Type "npm start" and press Enter.
>
> Now you can access the web app running at http://localhost:3000 in your browser. You can access the app with the link while in-game. Have fun!
> In the tgs folder you must put your WebMs in the Videos folder located inside the public folder. Refresh the web app to confirm that the WebMs have showed up. The WebMs > will not have any thumbnails! You must press on Thumbnailer to start the thumbnail generator in the background. Be patient with large number of files.
>
>**Current restrictions**
> Plays only WebMs because that's the only format the in-game Chromium based web browser supports in VAM.
>
>**Bugs**
> Sometimes the thumbnail generator bugs and crashes. Solution: Just restart the server!
> The implementation is a bit janky as I just spent one hour on this. I will improve it if there is demand for it and/or people like it.
>
>**Note for developers**
> FFmpeg is included with the source code and that's why it's 75MB. The source code is there if you wish to modify it. No restrictions from me!


**Features added in tgs_enhanced** 

*Channels*

If you create directories in your public/Videos directory, they'll be presented as channels at the top of the browser screen. All of the new play mode features described below operate within the context of your current channel. There is also an "all" channel which, as you might guess, includes videos from all of your videos plus those at the root of your public/Videos directory. 

(The thumbnailer utility has also been updated to function on individual channels, for whatever that's worth.)

Note: Currently, only one level of directories is supported. Nested channels might be nice, but I'm lazy and that would be harder to implement. :P

Known issue: If you for some reason have a NodeJS version lower than 10 installed, the app won't differentiate between files and directories, and your channel list will include all files at the root directory as well. So, update to the latest version of NodeJS if you can. Yes, I could write a more graceful degradation, but as I mentioned earlier I'm lazy -- and really, unless you are a developer trying to match versions with a project that's locked on an earlier NodeJS state, there's no reason not to update it.



*Previous and Next Buttons*

The standard video viewer how has previous and next buttons which allow you to step through your current channel sequentially.



*Auto-play vs Loop Toggle*

There is now a button on the standard video viewer to toggle between looping on the currently selected video and automatically progressing through all videos in your current channel. There is also a new button on the channel browser screen to jump straight into autoplaying the current channel from the start. (Individual video links on the browser screen still open in loop mode.)

Note: This toggle triggers a page refresh, meaning you can't change your mind late in a video without having to start it over from the begining. It really woudn't be too hard to make it dynamic, but again, lazy. Sorry!



*Randomize Player Mode*

As you might expect, this mode plays random videos from your current channel. This button appears at the top of both browser and viewer screens so you can quickly jump into the randomized player mode for your current channel from whereever you are, and so that you can quickly trigger a new random video when already in randomize mode. (While in randomize mode there will also be a button to swap back to auto-play mode from your currently selected video

Note: A simple cookie is used to prevent the same video from being chosen twice in a row. If for some reason cookies don't work, you might get repeats fairly often, particularly if your channel doesn't have many videos to select from. 



*Locked Player Mode*

When activated, all controls are removed and the player simply runs in randomized, loop, or auto-play mode until you hit browser back. This allows you to create simple kiosk/dump terminal style displays in VAM that just continually play your videos without distracting UI elements when you don't need them.



*Now Playing Display*

All player modes now tell you the name of the file playing. Helpful if you decide you want to move/change/delete a video while watching it, but aren't familar enough with the contents of your library to know the file name from the content of the video.

Note: This shows in Locked mode as well. Maybe it shouldn't? I'm not really sure.



