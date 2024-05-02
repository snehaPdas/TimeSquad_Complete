const User = require("../Models/userSchema");

const getCustomerData = async (req, res) => {
  try {
    const search = req.query.search || "";
    const page = parseInt(req.query.page) || 1;
    const limit = 3;
    const query = {
      isAdmin: "0",
      $or: [
        { name: { $regex: new RegExp(search, "i") } },
        { email: { $regex: new RegExp(search, "i") } },
      ],
    };
    const userData = await User.find(query)
      .limit(limit)
      .skip((page - 1) * limit)
      .exec();
    const count = await User.countDocuments(query);         
    const totalPages = Math.ceil(count / limit);

    res.render("admin/customers", {
      data: userData,
      totalPages,
      currentPage: page,
    });
    
  } catch (error) {
    console.log(error.message);
    res.status(500).send("server Error");
  }
};

const getCustomerBlocked = async (req, res) => {
  try {
    let id = req.query.id;
    
    const data = await User.updateOne(
      { _id: id },
      { $set: { isBlocked: true } }
    );
    res.redirect("/admin/user");
  } catch (error) {
    console.log(error.message);
  }
};

const getCustomerUnblocked = async (req, res) => {
  try {
    let id = req.query.id;
    await User.updateOne({ _id: id }, { $set: { isBlocked: false } });
    res.redirect("/admin/user");
  } catch (error) {
    console.log(error.message);
  }
};

module.exports = {
  getCustomerData,
  getCustomerBlocked,
  getCustomerUnblocked,
};
