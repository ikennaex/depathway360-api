const mongoose = require("mongoose");
const {Schema, model} = mongoose

const BlogPostSchema = new Schema({
    title: {type: String, required: true},
    image: {type: String, required: true},
    body: {type: String, required: true}
}, { timestamps: true });

const BlogPostModel = model("BlogPost", BlogPostSchema)
module.exports = BlogPostModel;