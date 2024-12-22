import { v2 as cloudinary } from "cloudinary";
import fs from 'fs'

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const uploadOnCloudinary = async (localFilePath) => {
  try {
    if(!localFilePath) return null
    //upload file on cloudinary
    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto"
    })
    // file has been uploaded successfully
    //console.log("File is uploaded on cloudinary", response);
    fs.unlinkSync(localFilePath) // delete the file from storage
    return response
  } catch (error) {
    fs.unlinkSync(localFilePath)// remove the locally saved temporary file as the upload operation got failed
    return null
  }
}

export {uploadOnCloudinary}

/*
File is uploaded on cloudinary {
  asset_id: '*******',
  public_id: '****',
  version: ******,
  version_id: '****',
  signature: '****',
  width: 5120,
  height: 3840,
  format: 'jpg',
  resource_type: 'image',
  created_at: '2024-12-22T11:45:04Z',
  tags: [],
  bytes: 3516645,
  type: 'upload',
  etag: '4dc1dd9a8b572defdbf26716571e736e',
  placeholder: false,
  url: 'http://res.cloudinary.com/deubnfjy9/image/upload/v1734867904/ukohauodqwdgfoowybma.jpg',
  secure_url: '******',
  asset_folder: '',
  display_name: 'ukohauodqwdgfoowybma',
  original_filename: 'IMG_20230323_141945',
  api_key: '*******'
}


*/

/*
//Upload an image
const uploadResult = await cloudinary.uploader
  .upload(
    'https://res.cloudinary.com/demo/image/upload/getting-started/shoes.jpg', {
        public_id: 'shoes',
    }
  )
  .catch((error) => {
      console.log(error);
});

console.log(uploadResult);
*/
