const BaseResponse = require('../models/base_response');
const Category = require('../models/category');
const cloudinary = require('../others/cloudinary.config');
const formidable = require('formidable');
const { validateSuperAdmin } = require("../others/validator");

const addCategory = async (req, res) => {
    try {
        const lang = req.headers["lang"];
        const data = await getFileFromReq(req);
        const msg = await validateSuperAdmin(req);
        if (msg) return res.send(new BaseResponse({ success: false, status: 403, msg: msg, lang }));
        const resCloudinary = await cloudinary.uploader.upload(data.image.filepath);
        const { arName, enName } = data;
        const category = await Category.create({ imageUrl: resCloudinary.url, arName, enName });
        res.send(new BaseResponse({ data: category, success: true, msg: "success" }));
    } catch (error) {
        // console.log(error);
        res.status(400).send(new BaseResponse({ success: false, msg: error.message }));
    }
};

const getCategories = async (req, res) => {
    try {
        const lang = req.headers["lang"];
        const { pageSize, page} = req.query;
        const size = Number(pageSize) ?? 10;
        const start = Number(page) ?? 0;
        const categories = await Category.findAll({offset: start * size, limit: size});
        const categoriesCount = await Category.count();
        res.send(new BaseResponse({ data: categories, success: true, msg: "success", lang, pagination: {total: categoriesCount, page: start, pageSize: size} }));
    } catch (error) {
        console.log(error);
        res.status(400).send(new BaseResponse({ success: false, msg: error.message , pagination: {}}));
    }
};

const updateCategory = async (req, res) => {
    try {
        const lang = req.headers["lang"];
        const msg = await validateSuperAdmin(req);
        if (msg) return res.send(new BaseResponse({ success: false, status: 403, msg: msg, lang }));
        if(!req.body.id) return res.send(new BaseResponse({ success: false, status: 403, msg: "id field is required", lang }));
        const category = await Category.findOne({ where:{id: req.body.id}});
        const {arName, enName, imageUrl} = req.body;
        category.arName = arName ?? category.arName;
        category.enName = enName ?? category.enName;
        category.imageUrl = imageUrl ?? category.imageUrl;
        await category.save();
        res.send(new BaseResponse({ data: category, success: true, msg: "updated successfully", lang }));
    } catch (error) {
        console.log(error);
        res.status(400).send(new BaseResponse({ success: false, msg: error.message }));
    }
};

const deleteCategory = async (req, res) => {
    try {
        const lang = req.headers["lang"];
        const msg = await validateSuperAdmin(req);
        if (msg) 
            return res.send(new BaseResponse({ success: false, status: 403, msg: msg, lang }));
        if(!req.params.id) 
            return res.send(new BaseResponse({ success: false, status: 400, msg: "id param is required", lang }));
        const id = Number(req.params.id);
        const category = await Category.findOne({ where:{id}});
        if(!category) 
            return res.send(new BaseResponse({ success: false, status: 404, msg: `there is no category with the id`, lang }));
        const isSuccess = !(!(await category.destroy()));
        res.send(new BaseResponse({ success: !(!isSuccess), msg: isSuccess?"deleted successfully":"there is someting wrong, please try again later", lang }));
    } catch (error) {
        console.log(error);
        res.status(400).send(new BaseResponse({ success: false, msg: error.message }));
    }
};


function getFileFromReq(req) {
    return new Promise((resolve, reject) => {
        const form = formidable({ multiples: true });
        form.parse(req, (error, fields, files) => {
            if (error) {
                reject(error);
                return;
            }
            resolve({ ...fields, ...files });
        });
        // const chunks = [];
        // req.on('data',(data)=>{
        //     chunks.push(data);
        // });
        // req.on('error', reject);
        // req.on('end', () => {
        //     resolve(Buffer.concat(chunks).toString());
        // });
    });
}


module.exports = { addCategory, getCategories, updateCategory, deleteCategory };
