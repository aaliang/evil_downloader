import sys
import json
import urllib

if __name__ == '__main__':
   file_name = sys.argv[1]
   dir_out = sys.argv[2]

   stuff = json.load(open (file_name))
   link_set = set()

   #insta
   #link_set.update(x['images']['standard_resolution']['url'] for x in stuff)


   statuses = stuff['statuses']
   for status in statuses:
      if 'media' in status['entities']:
         link_set.update(media['media_url']for media in status['entities']['media'])

   for link in link_set:
      l = link + ':large'
      print l

      # for media in status['entities']['media']:
      #    d =3
      # link_set.update(media['media_url']for media in status['entities']['media'])
      try:
         urllib.urlretrieve(l, dir_out + link.split('/')[-1])
      except Exception, e:
         print e.message
