const express = require("express");
const { auth } = require("../Middlewares/auth")
const { ToysModel, validatetoy } = require("../models/toyModel")
const router = express.Router();

router.get("/", async (req, res) => {
  let perPage = req.query.perPage || 10;
  let page = req.query.page || 1;

  try {
    let data = await ToysModel.find({})
      .limit(perPage)
      .skip((page - 1) * perPage)
      // .sort({_id:-1}) like -> order by _id DESC
      .sort({ _id: -1 })
    res.json(data);
  }
  catch (err) {
    console.log(err);
    res.status(500).json({ msg: "there error try again later", err })
  }
})


// /toys/search?s=
router.get("/search", async (req, res) => {
  try {
    let queryS = req.query.s;
    // מביא את החיפוש בתור ביטוי ולא צריך את כל הביטוי עצמו לחיפוש
    // i -> מבטל את כל מה שקשור ל CASE SENSITVE
    let searchReg = new RegExp(queryS, "i")
    let data = await ToysModel.find({ $or: [{ name: { $regex: searchReg } }, { info: { $regex: searchReg } }] })
      .limit(50)
    // if(!data)
    //  data = await ToysModel.find({info:searchReg})
    //  .limit(50)
    res.json(data);
  }
  catch (err) {
    console.log(err);
    res.status(500).json({ msg: "there error try again later", err })
  }
})
router.get("/category/:catname", async (req, res) => {
  let type = req.params.catname;
  let temp_ar = await ToysModel.filter(item => item.category == type)
  res.json(temp_ar)
})


router.post("/", auth, async (req, res) => {
  let validBody = validatetoy(req.body);
  if (validBody.error) {
    return res.status(400).json(validBody.error.details);
  }
  try {
    let cake = new ToysModel(req.body);
    cake.user_id = req.tokenData._id;
    await cake.save();
    res.status(201).json(cake);
  }
  catch (err) {
    console.log(err);
    res.status(500).json({ msg: "there error try again later", err })
  }
})


router.put("/:editId", auth, async (req, res) => {
  let validBody = validateToy(req.body);
  if (validBody.error) {
    return res.status(400).json(validBody.error.details);
  }
  try {
    let editId = req.params.editId;
    let data;
    if (req.tokenData.role == "admin") {
      data = await ToysModel.updateOne({ _id: editId }, req.body);
    }
    else {
      data = await ToysModel.updateOne({ _id: editId, user_id: req.tokenData._id }, req.body)
    }
    res.json(data);
  }
  catch (err) {
    console.log(err);
    res.status(500).json({ msg: "there error try again later", err })
  }
})



router.delete("/:delId", auth, async (req, res) => {
  try {
    let delId = req.params.delId;
    let data;
    if (req.tokenData.role == "admin") {
      data = await ToysModel.deleteOne({ _id: delId });
    }
    else {
      data = await ToysModel.deleteOne({ _id: delId, user_id: req.tokenData._id });
    }
    res.json(data);
  }
  catch (err) {
    console.log(err);
    res.status(500).json({ msg: "there error try again later", err })
  }
})


router.get("/single/:id", async (req, res) => {
  let id = req.params.id;
  try {
    let data = await ToyModel.findOne({ _id: id });
    res.json(data)
  }
  catch (err) {
    console.log(err);
    res.status(500).json({ msg: "err", err });
  }
})

router.get("/prices", async (req, res) => {
  try {
    let minQ = req.query.min || 0;
    let maxQ = req.query.max || Infinity;
    let perPage = req.query.perPage || 10;
    let data = await ToyModel.find({ price: { $gte: minQ, $lte: maxQ } }).limit(perPage)
    res.json(data);
  }
  catch (err) {
    console.log(err)
    res.status(500).json({ msg: "err", err })
  }
})
router.put("/:idEdit", auth, async (req, res) => {
  let validateBody = userValid(req.body);
  if (validateBody.error) {
    return res.status(400).json(validateBody.error.details);
  }
  try {
    let idEdit = req.params.idEdit;
    let data;
    if (req.tokenData.role == "admin") {
      data = await UserModel.updateOne({ _id: idEdit }, req.body);
    }
    else if (idEdit != req.tokenData._id) {
      return res.status(403).json({ msg: "Unauthorized access" })
    }
    else {
      data = await UserModel.updateOne({ _id: idEdit }, req.body);
    }
    let user = await UserModel.findOne({ _id: idEdit });
    user.password = await bcrypt.hash(user.password, 10);
    await user.save();
    user.password = "*****";
    res.json(data);
  }
  catch (err) {
    console.log(err);
    res.status(500).json({ msg: "err", err });
  }
})
router.delete("/:idDel", auth, async (req, res) => {
  let idDelete = req.params.idDel;
  let data;
  try {
    if (req.tokenData.role == "admin") {
      data = await UserModel.deleteOne({ _id: idDelete });
    }
    else if (idDelete != req.tokenData._id) {
      return res.status(403).json({ msg: "Unauthorized access" });
    }
    else {
      data = await UserModel.deleteOne({ _id: idDelete });
    }
    res.json(data);
  }
  catch (err) {
    console.log(err);
    res.status(500).json({ msg: "err", err });
  }
})
router.delete("/:idDel", auth, async (req, res) => {
  try {
    let idDel = req.params.idDel;
    let data;
    if (req.tokenData.role == "admin") {
      data = await ToyModel.updateOne({ _id: idDel });
    }
    else {
      data = await ToyModel.deleteOne({ _id: idDel, user_id: req.tokenData._id });
    }
    res.json(data);
  }
  catch (err) {
    console.log(err);
    res.status(500).json({ msg: "err", err })
  }
})


module.exports = router;

