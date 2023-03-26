# grab-site-visitor-info-php

I promise, I wanted to add some more private data collection methods, but I wasn't sure Github won't ban me. 

Okay, so what I did here is to make sure the script first collects the user's IP address using the $_SERVER['REMOTE_ADDR'] variable. That way, it'll work like taking cookies then, used the arp command to get the user's MAC address too. The most interesting part is, I made sure to collect the entire device information using the $_SERVER['HTTP_USER_AGENT'] variable. You can insert it in your next client site.

If you ever use this to collect MAC addresses, ONLY do it in respect to relevant privacy laws and regulations. I swear, if you call me ah no go answer!
