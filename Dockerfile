FROM node:slim
   
WORKDIR /app
   
COPY package*.json ./
   
RUN npm install --verbose
   
COPY . .
EXPOSE 3001
 
CMD [ "npm", "run" ,"dev" ]
