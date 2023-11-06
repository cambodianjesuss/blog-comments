const express = require('express');
const bodyParser = require('body-parser');
const { randomBytes } = require('crypto');
const cors = require('cors');
const axios = require('axios');

const app = express();
app.use(bodyParser.json());
app.use(cors());

const commentsByPostId = {};

app.get('/', (req, res)=>{
    res.send("Hello Comments!")
})

app.get('/posts/:id/comments', (req, res)=>{
    res.send(commentsByPostId[req.params.id] || []);
});

app.post('/posts/:id/comments', async (req, res)=>{
    const commentId = randomBytes(4).toString('hex');
    const {content} = req.body;

    const comments = commentsByPostId[req.params.id] || [];

    comments.push({ id: commentId, content, status: "pending"});
    
    commentsByPostId[req.params.id] = comments;

    // Events to Emit
    await axios.post('http://localhost:4005/events', {
        type: 'CommentCreated',
        data: {
            id: commentId,
            content,
            postId: req.params.id,
            status: 'pending'
        }
    }).catch(error =>{console.log(error.message)});

    res.status(201).send(comments);
});

app.post('/events', (req, res)=>{
    console.log('Received Event:', req.body.type);

    const { type, data } = req.body;

    if(type === 'CommentModerated'){
        const  {postId, id, status} = data;

        const comments = commentsByPostId[postId];
        
        const comment = comments.find(comment => {
            return comment.id === id;
        });
        comment.status = status;
    }
    res.send({});
});

app.listen(4001, ()=>{
    console.log('Comments Service on 4001');
});