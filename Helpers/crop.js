// const sharp=require("sharp")
// const fs=require("fs")
// const path=require("path")

// function cropAndReplaceOriginal(req, res, next){
// const inputPath=req.file.path
// const outputFilename = req.file.filename; 
// const outputPath=path.join(__dirname,"../public/uploads/product-images",outputFilename)
// sharp(inputPath)
// .extract({left:20,top:20,width:20,height:20})
// .toFile(outputPath,async(err,info)=>{
// if(err){
//     console.error(err)
//     return res.status(500).json({error:"erron in cropping image"})

// }
// console.log("image cropped successfully:",info)
// try {
//     await  fs.unlink(inputPath)
//     console.log("orginal image has deleted successfully")
//     res.json({imagePath:`/public/uploads/product-images/${outputFilename}`})
    
// } catch (error) {
//     console.error("Error deleting original image:", error);
//     res.status(500).json({ error: "Error deleting original image" });
    
// }




// })
// }


// module.exports={cropAndReplaceOriginal}