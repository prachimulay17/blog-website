import dotenv from "dotenv";
dotenv.config();


import {v2 as cloudinary} from 'cloudinary';
import fs from 'fs';
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});


const uploadoncloudinary = async (localfilepath) => {

  try {
    if(!localfilepath)return null;
    const response = await cloudinary.uploader.upload(localfilepath,{
      resource_type: 'auto',
      folder: "purpleblog/avatars"
    });
    console.log('cloudinary response',response.url);
    const localfilepathexist=fs.existsSync(localfilepath);

      if(localfilepathexist){
    fs.unlinkSync(localfilepath); //remove file from local storage after upload
      }

    return response;

  } catch (error) {
    //if file not uploaded remove locally saved file
    fs.unlinkSync(localfilepath);
    console.log('cloudinary upload error',error);
    return null;
  }
}

export {uploadoncloudinary}