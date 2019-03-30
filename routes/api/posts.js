const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const passport = require("passport");

//load validation
const validatePostInput = require("../..//validation/post");

//load post model
const Post = require("../../models/Post");
//load proflie model
const Profile = require("../../models/Profile");
//@route    GET api/posts/test
//@desc     Test post route
//@access   Public
router.get("/test", (req, res) => res.json({ msg: "Post Works" }));

//@route    GET api/posts
//@desc     Get post
//@access   Public
router.get("/", (req, res) => {
  Post.find()
    .sort({ date: -1 })
    .then(posts => res.json(posts))
    .catch(err => res.status(404).json({ nopostfound: "no posts found" }));
});

//@route    GET api/posts/:id
//@desc     Get post by id
//@access   Public
router.get("/:id", (req, res) => {
  Post.findById(req.params.id)
    .then(post => res.json(post))
    .catch(err =>
      res.status(404).json({ nopostfound: "no post found with that id" })
    );
});

//@route    POST api/posts
//@desc     Create post
//@access   Prviate
router.post(
  "/",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    const { errors, isValid } = validatePostInput(req.body);

    if (!isValid) {
      return res.status(400).json(errors);
    }
    const newPost = new Post({
      text: req.body.text,
      name: req.body.name,
      avatar: req.body.avatar,
      user: req.user.id
    });

    newPost.save().then(post => res.json(post));
  }
);

//@route    DELETE api/posts/:id
//@desc     Delete post by id
//@access   Prviate
router.delete(
  "/:id",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    Profile.findOne({ user: req.user.id }).then(profile => {
      Post.findById(req.params.id)
        .then(post => {
          if (post.user.toString() !== req.user.id) {
            return res
              .status(401)
              .json({ NotAuthorized: "User not authorized" });
          }
          //delete
          post.remove().then(() => res.json({ success: true }));
        })
        .catch(err => res.status(404).json({ postnotfound: "No post found" }));
    });
  }
);

//@route    POST api/posts/like/:id
//@desc     Like a post by id
//@access   Prviate
router.post(
  "/like/:id",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    Profile.findOne({ user: req.user.id }).then(profile => {
      Post.findById(req.params.id)
        .then(post => {
          if (
            post.likes.filter(like => like.user.toString() === req.user.id)
              .length > 0
          ) {
            return res
              .status(400)
              .json({ alreadyLiked: "User already liked this post" });
          }

          //Add user id to likes array
          post.likes.unshift({ user: req.user.id });
          post.save().then(post => {
            res.json(post);
          });
        })
        .catch(err => res.status(404).json({ postnotfound: "No post found" }));
    });
  }
);

//@route    POST api/posts/unlike/:id
//@desc     Unlike a post by id
//@access   Prviate
router.post(
  "/unlike/:id",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    Profile.findOne({ user: req.user.id }).then(profile => {
      Post.findById(req.params.id)
        .then(post => {
          if (
            post.likes.filter(like => like.user.toString() === req.user.id)
              .length === 0
          ) {
            return res
              .status(400)
              .json({ notLiked: "User has not liked this post" });
          }

          //get remove index
          const removeIndex = post.likes
            .map(item => item.user.toString())
            .indexOf(req.user.id);

          //splice index out of array
          post.likes.splice(removeIndex, 1);
          post.save().then(post => res.json(post));
        })
        .catch(err => res.status(404).json({ postnotfound: "No post found" }));
    });
  }
);

//@route    POST api/posts/comment/:id
//@desc     Add comment to a post
//@access   Prviate
router.post(
  "/comment/:id",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    const { errors, isValid } = validatePostInput(req.body);

    if (!isValid) {
      return res.status(400).json(errors);
    }
    Post.findById(req.params.id)
      .then(post => {
        const newComment = {
          text: req.body.text,
          name: req.body.name,
          avatar: req.body.avatar,
          user: req.user.id
        };

        //Add to comments array
        post.comments.unshift(newComment);
        post.save().then(post => res.json(post));
      })
      .catch(err => res.status(404).json({ postnotfound: "No post found" }));
  }
);

//@route    DELETE api/posts/comment/:id/:comment_id
//@desc     Delete comment to a post
//@access   Prviate
router.delete(
  "/comment/:id/:comment_id",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    Post.findById(req.params.id)
      .then(post => {
        //check if comment exists
        if (
          post.comments.filter(
            comment => comment._id.toString() === req.params.comment_id
          ).length === 0
        ) {
          return res
            .status(404)
            .json({ commentnotfound: "Comment doesn't exist" });
        }
        const removeIndex = post.comments
          .map(item => item._id.toString())
          .indexOf(req.params.comment_id);
        //splice outta array
        post.comments.splice(removeIndex, 1);
        post.save().then(post => res.json(post));
      })
      .catch(err => res.status(404).json({ postnotfound: "No post found" }));
  }
);

module.exports = router;
