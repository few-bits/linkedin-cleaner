# linkedin-cleaner

Now you can iterate over your linkedin connections and remove unwanted.

0. `yarn`

1. Fill **PREFERRED_NAMES** array with names which are mustn't be removed:
`
PREFERRED_NAMES = ['John Doe', 'Keanu Reeves']
`

2. Fill **PREFERRED_OCCUPATIONS** array with occupations which are mustn't be removed:
`
PREFERRED_NAMES = ['Google', 'OOO Roga & Kopita']
`

3. Fill **UNWANTED_TAGS** array with tags which are mustn't be removed:
`
UNWANTED_TAGS = ['Evil', 'Sad']
`
 
4. Start chrome with debugg flag:
`
google-chrome-stable --remote-debugging-port=9222
`

5. Login into linkedin
 
6. Run script: `node index.js`
