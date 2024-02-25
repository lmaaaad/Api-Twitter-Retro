FROM node:slim
   
WORKDIR /app
   
COPY package*.json ./
   
RUN npm install --verbose express body-parser bcrypt cors dotenv gridfs-stream multer multer-gridfs-storage helmet morgan jsonwebtoken mongoose
   
COPY . .
EXPOSE 3001
 
CMD [ "npm", "start" ]
