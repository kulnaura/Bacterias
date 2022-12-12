
const CONSTS = {
    WORLD: {
        INIT: {
            BACTERIA_NUM: 5,
            FOOD_NUM: 10
        },
        INTERVAL: 100
    },
    BACTERIA: {
        SIZE: 3,
        COLOR: 'gray'
    },
    FOOD: {
        SIZE: 1,
        COLOR: 'blue',
        GENERATE_INTERVAL_MIN: 2000,
        GENERATE_INTERVAL_MAX: 12000,
    }
}
const storage = {
    bacteriaIdIterator: 0,
    bacterias: [],
    bacteriasIds: [],
    foodIdIterator: 0,
    food: [],
    foodGenerateTime: 0,
    foodGenerateTimeValue: 0
}
let runInterval
let canvas
let ctx

function drawBacteria ({x = -1, y = -1, radius = 3, color}) {
    ctx.beginPath()
    ctx.arc(x, y, radius, 0, 360, 0)
    ctx.fillStyle = color || CONSTS.BACTERIA.COLOR
    ctx.fill()
}

function drawCanvas () {
    //ctx.beginPath()
    ctx.fillStyle = "#d7e7f6"
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.fillRect(0, 0, canvas.width, canvas.height)
}

function addBacteria (params) {
    const { additionalParams = {} } = params
    const id = storage.bacteriaIdIterator
    storage.bacterias.push({
        id,
        x: params.x,
        y: params.y,
        radius: params.radius,
        type: 'bacteria',
        status: 'alive',
        action: 'checkFood',
        target: null,
        speed: 1,
        eatValue: 0.1,
        storageFoodValue: 1,
        storageFoodMax: 2,
        storageFoodLossValue: 0,
        storageFoodLossTime: 10000,
        foodValue: 1,
        foodMax: 1,
        hungerValue: 0,
        hungerTime: 1000,
        hunger: 0,
        hungerMax: 10,
        preparedToSplit: false,
        // hp: 1,
        ...additionalParams
    })
    storage.bacteriasIds.push(id)
    storage.bacteriaIdIterator++
}

function createBacteria (options = {}) {
    const config = {
        randomPosition: true,
        ...options
    }
    const size = config?.size || CONSTS.BACTERIA.SIZE
    const coordinates = {
        x: 0,
        y: 0
    }
    if (config.randomPosition) {
        coordinates.x = (Math.round(Math.random() * (canvas.width - size * 2)) + size)
        coordinates.y = (Math.round(Math.random() * (canvas.height - size * 2)) + size)
    } else {
        coordinates.x = config.x + Math.round(Math.random() * size * 2) - size
        coordinates.y = config.y + Math.round(Math.random() * size * 2) - size
    }
    const params = {
        x: coordinates.x,
        y: coordinates.y,
        radius: size,
        additionalParams: options.additionalParams
    }
    addBacteria(params)
    drawBacteria(params)
}

function showBacteria (bacteria) {
    //console.log('show bacteria', bacteria)
    const params = {
        x: bacteria.x,
        y: bacteria.y,
        radius: bacteria.radius
    }
    drawBacteria(params)
}

function drawBacterias () {
    for(let i = 0; i < storage.bacterias.length; i++) {
        const bacteria = storage.bacterias[i]
        showBacteria(bacteria)
    }
}

function createInitPopulation () {
    const bacteriasNum = CONSTS.WORLD.INIT.BACTERIA_NUM
    for(let i = 0; i < bacteriasNum; i++) {
        createBacteria()
    }
}


function drawFood ({x = -1, y = -1, radius = 1, color}) {
    ctx.beginPath()
    ctx.arc(x, y, radius, 0, 360, 0)
    ctx.fillStyle = color || CONSTS.FOOD.COLOR
    ctx.fill()
}

function addFood (params) {
    storage.food.push({
        id: storage.foodIdIterator,
        x: params.x,
        y: params.y,
        radius: params.radius,
        type: 'food',
        status: 'alive',
        speed: 0,
        foodValue: 1,
        foodMax: 1
        // hp: 1,
    })
    storage.foodIdIterator++
}

function createFood (config = {randomPosition: true}) {
    const size = config?.size || CONSTS.FOOD.SIZE
    const coordinates = {
        x: config.randomPosition ? (Math.round(Math.random() * (canvas.width - size * 2)) + size) : Math.round(canvas.width / 2),
        y: config.randomPosition ? (Math.round(Math.random() * (canvas.height - size * 2)) + size) : Math.round(canvas.height / 2)
    }
    const params = {
        x: coordinates.x,
        y: coordinates.y,
        radius: size
    }
    addFood(params)
    drawFood(params)
}

function showFood (food) {
    //console.log('show food', food)
    const params = {
        x: food.x,
        y: food.y,
        radius: food.radius
    }
    drawFood(params)
}

function drawFoods () {
    for(let i = 0; i < storage.food.length; i++) {
        const food = storage.food[i]
        showFood(food)
    }
}

function setFoodGenerateTime () {
    storage.foodGenerateTimeValue = 0
    storage.foodGenerateTime = Math.round(Math.random() * (CONSTS.FOOD.GENERATE_INTERVAL_MAX - CONSTS.FOOD.GENERATE_INTERVAL_MIN))
}

function createInitFood () {
    const foodNum = CONSTS.WORLD.INIT.FOOD_NUM
    for(let i = 0; i < foodNum; i++) {
        createFood()
    }
    setFoodGenerateTime()
}

function getDistance (obj1, obj2) {
    const xDiff = obj1.x - obj2.x
    const yDiff = obj1.y - obj2.y
    return Math.round(Math.sqrt(xDiff * xDiff + yDiff * yDiff))
}

function foodSearch (bacteria, radius = 100) {
    let nearestFood
    let distance = null
    for(let i = 0; i < storage.food.length; i++) {
        const food = storage.food[i]
        const foodDistance = getDistance(bacteria, food)
        if((distance !== null && foodDistance < distance) || distance === null) {
            nearestFood = food
            distance = foodDistance
        }
    }
    return {
        status: !!nearestFood,
        target: nearestFood
    }
}

function getFoodDistance (bacteria, food) {
    const target = food || bacteria.target
    if (!target) {
        return {
            status: 'noTarget'
        }
    }
    const xDiff = bacteria.x - target.x
    const yDiff = bacteria.y - target.y

    const distance = getDistance(bacteria, target)

    const radians = Math.atan2(xDiff, yDiff)
    const degrees = Math.round(radians / Math.PI * 180)
    let targetPosition = 'top'

    if (degrees > 45 && degrees <= 135) {
        targetPosition = 'top'
    } else if (degrees > -45 && degrees <= 45) {
        targetPosition = 'right'
    } else if (degrees > -135 && degrees <= -45) {
        targetPosition = 'bottom'
    } else if ((degrees > 135 && degrees <= 180) || (degrees >= -180 && degrees <= -135)) {
        targetPosition = 'left'
    }

    return {
        direction: targetPosition,
        distance,
        status: 'foodPresent'
    }
}

function moveBacteriaToDirection (bacteria, direction) {
    switch (direction) {
        case 'top':
            bacteria.x = bacteria.x - bacteria.speed
            break;
        case 'bottom':
            bacteria.x = bacteria.x + bacteria.speed
            break;
        case 'left':
            bacteria.y = bacteria.y + bacteria.speed
            break;
        case 'right':
            bacteria.y = bacteria.y - bacteria.speed
            break;
    }
}

function moveChaotic (bacteria) {
    const moveDirections = ['top', 'bottom', 'left', 'right']
    const direction = moveDirections[Math.round(Math.random() * 3)]
    moveBacteriaToDirection(bacteria, direction)
}

function moveBacteriaSomewhere (bacteria) {
    bacteria.action = 'moveToSomeDirection'
    bacteria.actionCounter = 10
}

function destroyFood (food) {
    const foodIndex = storage.food.indexOf(food)
    if (foodIndex !== -1) {
        storage.food.splice(foodIndex, 1)
    }
}

function eatFood (bacteria, food) {
    food.foodValue = food.foodValue - bacteria.eatValue
    bacteria.storageFoodValue += bacteria.eatValue
    if (bacteria.hungerValue > 0) {
        bacteria.hungerValue -= CONSTS.WORLD.INTERVAL * 3
        if (bacteria.hungerValue < 0) {
            bacteria.hungerValue = 0
            if (bacteria.hunger > 0) {
                bacteria.hunger--
                bacteria.hungerValue = bacteria.hungerTime
            }
        }
    }
    if (bacteria.storageFoodValue >= bacteria.storageFoodMax) {
        bacteria.target = null
        moveBacteriaSomewhere(bacteria)
        // set action = prepare to split
        bacteria.preparedToSplit = true
    }
    if (food.foodValue <= 0) {
        bacteria.target = null
        destroyFood(food)
        moveBacteriaSomewhere(bacteria)
    }
}

function destroyBacteria (bacteria) {
    const bacteriaIndex = storage.bacterias.indexOf(bacteria)
    const idIndex = storage.bacteriasIds.indexOf(bacteria.id)
    storage.bacterias.splice(bacteriaIndex, 1)
    storage.bacteriasIds.splice(idIndex, 1)
}

function splitBacteria (bacteria) {
    const bacteriaFoodStorage = parseFloat((bacteria.storageFoodValue / 2).toFixed(1))
    bacteria.storageFoodValue = bacteriaFoodStorage
    bacteria.preparedToSplit = false
    createBacteria({
        randomPosition: false,
        x: bacteria.x,
        y: bacteria.y,
        additionalParams: {
            storageFoodValue: bacteriaFoodStorage
        }
    })
}

function updateBacteriaState (bacteria) {
    bacteria.storageFoodLossValue += CONSTS.WORLD.INTERVAL
    if (bacteria.storageFoodLossValue >= bacteria.storageFoodLossTime) {
        bacteria.storageFoodLossValue = 0
        bacteria.storageFoodValue -= 1
        if (bacteria.storageFoodValue < 0 ) {
            bacteria.storageFoodValue = 0
        }
    }
    if (bacteria.storageFoodValue <= 0) {
        bacteria.hungerValue += CONSTS.WORLD.INTERVAL
        if (bacteria.hungerValue >= bacteria.hungerTime) {
            bacteria.hunger ++
            bacteria.hungerValue = 0
            if (bacteria.hunger >= bacteria.hungerMax) {
                destroyBacteria(bacteria)
            }
        }
    }
}

function bacteriaActions () {
    storage.bacteriasIds = storage.bacterias.map(bacteria => bacteria.id)
    do {
        const bacteriaId = storage.bacteriasIds.shift()
        const bacteria = storage.bacterias.find(bacteria => bacteria.id === bacteriaId)
        if (!bacteria && !storage.bacteriasIds.length) {
            continue
        }
        if (bacteria) {
            console.log('bacteria', bacteria)
            console.log('storage.bacteriasIds', storage.bacteriasIds)
            updateBacteriaState(bacteria)
            if (bacteria.preparedToSplit) {
                splitBacteria(bacteria)
            }
            if (bacteria.action === 'checkFood') {
                const foodSearchResult = foodSearch(bacteria)
                if (foodSearchResult.status) {
                    bacteria.action = 'moveToFood'
                    bacteria.target = foodSearchResult.target
                }
            } else if (bacteria.action === 'moveToFood') {
                const getFoodDistanceResult = getFoodDistance(bacteria)
                if (getFoodDistanceResult.status === 'noTarget') {
                    bacteria.target = null
                    moveBacteriaSomewhere(bacteria)
                } else if (getFoodDistanceResult.status === 'foodPresent') {
                    if (getFoodDistanceResult.distance > (bacteria.radius + bacteria.target.radius)) {
                        moveBacteriaToDirection(bacteria, getFoodDistanceResult.direction)
                        // move to target
                    } else if (bacteria.storageFoodValue < bacteria.storageFoodMax) {
                        // eatFood
                        eatFood(bacteria, bacteria.target)
                    }
                }
            } else if (bacteria.action === 'moveToSomeDirection') {
                moveChaotic(bacteria)
                // ??
                if (bacteria.actionCounter > 0) {
                    bacteria.actionCounter--
                } else {
                    bacteria.actionCounter = 0
                    bacteria.action = 'checkFood'
                }
            }
        }
    } while (storage.bacteriasIds.length)
}

function generateNewFood () {
    storage.foodGenerateTimeValue += CONSTS.WORLD.INTERVAL
    if (storage.foodGenerateTimeValue >= storage.foodGenerateTime) {
        setFoodGenerateTime()
        createFood()
    }
}

function foodsActions () {
    return
}

function drawWorld () {
    console.log('draw world')
    drawCanvas()
    generateNewFood()
    drawFoods()
    drawBacterias()
    bacteriaActions()
    foodsActions()
}

function runLive () {
    runInterval = setInterval(drawWorld, CONSTS.WORLD.INTERVAL)
}

function init () {
    const app = document.getElementById('app')
    console.log('app', app)
    canvas = document.createElement('canvas')
    canvas.setAttribute('id', 'main')
    canvas.setAttribute('width', 300)
    canvas.setAttribute('height', 200)
    ctx = canvas.getContext("2d")
    ctx.fillStyle = "#d7e7f6"
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    app.appendChild(canvas)
    // create init bacteria population
    createInitFood()
    createInitPopulation()

}


window.onload = function () {
    console.clear()
    console.log('bacteria_test', bacteria_test)
    init()
    runLive()
}