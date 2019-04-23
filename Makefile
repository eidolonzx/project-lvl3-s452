install:
	npm install

start:
	npm run babel-node -- src/index.js

publish:
	npm publish

test:
	npm run test

lint:
	npx eslint .

build:
	npm run deploy

surge:
	surge ./dist heavenly-quartz.surge.sh/