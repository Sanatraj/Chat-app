const socket=io()

const $messageForm=document.querySelector('#messageForm')
const $messageInput=$messageForm.querySelector('input')
const $messageButton=$messageForm.querySelector('button')
const $shareLocation=document.querySelector('#shareLocation')
const $messages=document.querySelector('#messages')

const $messageTemplates=document.querySelector('#messageTemplate').innerHTML
const $locationTemplate=document.querySelector('#locationTemplate').innerHTML
const $sidebarTemplate=document.querySelector('#sidebarTemplate').innerHTML


const {username,room}=Qs.parse(location.search,{ignoreQueryPrefix:true})
console.log({username,room})

const autoScroll=() => {
    const $newMessage=$messages.lastElementChild

    const newMessageStyle=getComputedStyle($newMessage)
    const newMessageMargin=parseInt(newMessageStyle.marginBottom)
    const newMessageHeight = $newMessage.offsetHeight + newMessageMargin

    const visibleHeight=$messages.offsetHeight
    const containerHeight=$messages.scrollHeight

    const scrollOffset=$messages.scrollTop+visibleHeight
    
    if(containerHeight-newMessageHeight<=scrollOffset){
        $messages.scrollTop=$messages.scrollHeight
    }
}

socket.on('message', (message)=>{
    console.log(message)
    const html=Mustache.render($messageTemplates,{
        username:message.username,
        message:message.text,
        createdAt:moment(message.createdAt).format('h:mm a')
    })
    $messages.insertAdjacentHTML('beforeend',html)
    autoScroll()
})

socket.on('locationMessage',(url)=>{
    console.log(url)
    const html=Mustache.render($locationTemplate,{
        username:url.username,
        url:url.url,
        createdAt:moment(url.createdAt).format('h:mm a')
    })
    $messages.insertAdjacentHTML('beforeend',html)
    autoScroll()
})

socket.on('roomData',({room,users})=>{
    const html=Mustache.render($sidebarTemplate,{
        room,
        users
    })
    document.querySelector('#sidebar').innerHTML=html
})

$messageForm.addEventListener('submit',(e)=>{
    e.preventDefault()
    $messageButton.setAttribute('disabled','disabled')

    let mszVal=e.target.elements.message.value
    socket.emit('sendMessage',mszVal,(error)=>{
        $messageButton.removeAttribute('disabled')
        $messageInput.value=''
        $messageInput.focus()
        if(error){
            return console.log('Error!',error)
        }
        console.log('Sent message')
    })
})

$shareLocation.addEventListener('click',()=>{
    if(!navigator.geolocation)
    {
        alert('Geolocation is not supported by this browser')
    }

    $shareLocation.setAttribute('disabled','disabled')
    navigator.geolocation.getCurrentPosition((position)=>{
        socket.emit('shareLocation',{
            latitude:position.coords.latitude,
            longitude:position.coords.longitude
        },(error)=>{
            $shareLocation.removeAttribute('disabled')
            if(error){
                return console.log('Error!',error)
            }
            console.log('Location shared')
        })
    })
})

socket.emit('join',{username,room},(error)=>{
    console.log(username,room)
    if(error){
        alert(error)
        location.href='/'
    }
})