let express = require("express");
let mongoose = require("mongoose");
let path = require("path");
let ejsMate = require("ejs-mate");
let joi = require("joi");
let methodoverride = require("method-override");
let campground = require("./models/campgrounds");
let catchasync = require("./utils/catchasync");
let { campgroundschema, reviewschema } = require("./schemas");
const expresserror = require("./utils/expresserror");
const review = require("./models/review");

let app = express();
app.engine("ejs", ejsMate);
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(methodoverride("_method"));
app.use(express.urlencoded({ extended: true }));

mongoose
  .connect("mongodb://127.0.0.1:27017/yelp-camp", {
    useNewUrlParser: true,
    // useCreateIndex : true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("connection established!!!");
  })
  .catch((err) => {
    console.log("error!!!");
  });

let validatecampground = (req, res, next) => {
  const { error } = campgroundschema.validate(req.body);
  if (error) {
    let msg = error.details.map((el) => el.message).join(",");
    throw new expresserror(msg, 400);
  } else next();
};
let validatereview = (req, res, next) => {
  const { error } = reviewschema.validate(req.body);
  if (error) {
    let msg = error.details.map((el) => el.message).join(",");
    throw new expresserror(msg, 400);
  } else next();
};
app.get("/", (req, res) => {
  res.send("hello to yelp camp");
});

app.get(
  "/campgrounds",
  catchasync(async (req, res) => {
    let data = await campground.find({});
    res.render("campgrounds/index", { data });
  })
);
app.post(
  "/campgrounds",
  validatecampground,
  catchasync(async (req, res) => {
    let data = req.body.campground;
    // if (!data) {
    //   throw new expresserror("Invalid Campground data!!", 400);
    // }
    let el = new campground(data);
    await el.save();
    res.redirect(`/campgrounds/${el._id}`);
  })
);
app.get("/campgrounds/new", (req, res) => {
  res.render("campgrounds/new");
});
app.get(
  "/campgrounds/:id/edit",
  catchasync(async (req, res) => {
    let id = req.params.id;
    let data = await campground.findById(id);
    res.render("campgrounds/edit", { data });
  })
);
app.get(
  "/campgrounds/:id",
  catchasync(async (req, res) => {
    let id = req.params.id;
    let data = await campground.findById(id).populate('reviews');
    console.log(data);
    res.render("campgrounds/show", { data });
  })
);

app.post(
  "/campgrounds/:id/reviews",validatereview,
  catchasync(async (req, res) => {
    let id = req.params.id;
    let currentcampground = await campground.findById(id);
    let rev = new review(req.body.review);
    currentcampground.reviews.push(rev);
    await rev.save();
    await currentcampground.save();
    res.redirect(`/campgrounds/${id}`);
  })
);
app.delete(
  "/campgrounds/:id",
  catchasync(async (req, res) => {
    let id = req.params.id;
    let data = await campground.findByIdAndDelete(id);
    res.redirect("/campgrounds");
  })
);
app.delete("/campgrounds/:id/reviews/:reviewid",catchasync(async(req,res)=>{
  let id = req.params.id;
  let reviewid = req.params.reviewid;
  await campground.findByIdAndUpdate(id,{$pull : {reviews:reviewid}});
  await review.findByIdAndDelete(reviewid);
  res.redirect(`/campgrounds/${id}`);
}))
app.put(
  "/campgrounds/:id",
  catchasync(async (req, res) => {
    let id = req.params.id;
    let el = await campground.findByIdAndUpdate(id, req.body.campground, {
      new: true,
      runValidators: true,
    });
    res.redirect(`/campgrounds/${id}`);
  })
);
app.all("*", (req, res, next) => {
  next(new expresserror("Page Not Found", 404));
});
app.use((err, req, res, next) => {
  let { message = "Something went wrong", statuscode = 500 } = err;
  res.status(statuscode).render("error", { err });
});
app.listen(3000, () => {
  console.log("the server is up and runnning");
});
