#!/usr/bin/python -u
import os
import urllib2
import mechanize
import json
import sys, struct, subprocess


def encodeMessage(messageContent):
  encodedContent = json.dumps(messageContent)
  encodedLength = struct.pack('@I', len(encodedContent))
  return {'length': encodedLength, 'content': encodedContent}

# Send an encoded message to stdout.
def sendMessage(encodedMessage):
  sys.stdout.write(encodedMessage['length'])
  sys.stdout.write(encodedMessage['content'])
  sys.stdout.flush()


# getting the message sent from the browser extension
messages = []
while len(messages)<5:
	rawLength = sys.stdin.read(4)
	if len(rawLength) == 0:
		sys.exit(0)
	messageLength = struct.unpack('@I', rawLength)[0]
	message = sys.stdin.read(messageLength)
	messages.append(json.loads(message))

# create the mechanize browser instance
br = mechanize.Browser()


# get the mode of download
mode = messages[4]

# cookie required to download the song which is sent by the browser extension 
# in the first part of the message
Cookie = "hdntl="+messages[0]

#getting the referrer url from the extension
referrer = messages[3].strip()

br.addheaders = [('Cookie',Cookie)]


# the second part of the message is the url of the index file which is needed to be fetched
# and then processed to get the links of the segments for downloading
url = messages[1]

# getting the index file for getting the link to the segments
index = br.open(url).read()
index = index.split("\n")
#print index
for i,word in enumerate(index):
	if word and word[0] == '#':
		index[i] = ''

# setting the headers for downloading the .ts files
br.addheaders = [('Cookie',Cookie),('Origin','https://gaana.com'),('Referrer',referrer)]

# removing the spaces from name of the song
name = '_'.join(messages[2].split())

if mode == "1":
	# then the index file contains the whole link
	if not os.path.isfile('./'+name+'.ts'):
		for urls in index:
			if urls:
				response = br.open(urls+'&'+Cookie).read()
				with open(name+'.ts','a') as p:
					p.writelines(response)
elif mode == "2":
	# the index file contains the last part of the url
	base_url = url[:url.rfind("/")+1]
	for part in index:
		if part:
			response = br.open(base_url+part).read()
			with open(name+'.ts','a') as p:
				p.writelines(response)



# check if directory named Gaana exists, if not then create the directory
if not os.path.exists('./Gaana/'):
	os.makedirs('Gaana')

# converting the .ts file to mp3 using ffmpeg
subprocess.call(['ffmpeg','-i',name+'.ts','./Gaana/'+name+'.mp3'])
os.remove('./'+name+'.ts')

sendMessage(encodeMessage("Completed"))