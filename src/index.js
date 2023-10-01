const express= require('express')
const path=require('path')
const socketio= require('socket.io')
const http= require('http')
const Filter=require('bad-words')
const {generateMessage,generateLocation}=require('./utils/messages')
const {addUser,removeUser,getUser,getUsersInRoom}=require('./utils/users')

const port=process.env.PORT || 3000


const app=express()
const server=http.createServer(app)
const io=socketio(server)

const pathDirectory= path.join(__dirname,'../public')
app.use(express.static(pathDirectory))
 
io.on('connection',(socket)=>{
    console.log("New socket connection")

    socket.on('join',(options,callback)=>{
        console.log('Options:',options)
        const {error,user}=addUser({id:socket.id, ...options})

        if(error){
            return callback(error)
        }

        if(user){
        socket.join(user.room)

        socket.emit('message',generateMessage('Admin','Welcome!'))
        socket.broadcast.to(user.room).emit('message',generateMessage('Admin',`${user.username} has joined!`))

        callback()

        io.to(user.room).emit('roomData',{
            room: user.room,
            users:getUsersInRoom(user.room)
        })
        }
        else{
            console.error('User or room is missing or undefined:', user)
            callback('Room is missing or undefined for the user.')
        }

    })

    socket.on('sendMessage',(mszVal,callback)=>{
        let user=getUser(socket.id)
        console.log('UserID',user.id)
        const filter=new Filter()
        if(filter.isProfane(mszVal)){
            return callback('Profanity detected!')
        }
        io.to(user.room).emit('message',generateMessage(user.username,mszVal))
        callback()
    })

    socket.on('shareLocation',(position,callback)=>{
        let user=getUser(socket.id)
        io.to(user.room).emit('locationMessage',generateLocation(user.username,`http://google.com/maps?q=${position.latitude},${position.longitude}`))
        callback(null)
    })

    socket.on('disconnect',()=>{
        let user=removeUser(socket.id)
        if(user){
            io.to(user.room).emit('message',generateMessage('Admin',`${user.username} has left the room!`))   
            io.to(user.room).emit('roomData',{
                room: user.room,
                users:getUsersInRoom(user.room)
            })
        }
    })

})
server.listen(port,()=>{
    console.log(`Server is running on port ${port}`)
})

