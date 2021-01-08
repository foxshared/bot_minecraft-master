// Node.js program minecraft project 
// Bot server with heroku from mineflayer library
// Declare Library in that must valid in package

// process bot work

// find pool of water...with look at it
// go near the pool
// check fishing rod..tool..if not proceed
// start fishing
// if fish valid go to chest for deposit it..
// and start it over

const mineflayer = require('mineflayer');

const { pathfinder, Movements } = require('../')

const { GoalNear, GoalBlock, GoalXZ, GoalY, GoalInvert, GoalFollow } = require('../').goals

const express = require('express');

const wakeDyno = require('woke-dyno');

const goals = require('../lib/goals');
// Start listen port.
const PORT = process.env.PORT || 3000;

const app = express();

app.listen(PORT, () => {
    console.log('Listen on ${ PORT }');
    // Make Heroku server not sleep with call back the heroku app ur
    wakeDyno('https://foxbotminecraft.herokuapp.com/').start();
});

// Set the server target and bot username.....cracked only
var options = {
    host: 'the_worlder.aternos.me',//master99ayase.aternos.me
    port: 25565,//25565
    username: '123',
    version: false
}

var bot = mineflayer.createBot(options);

let mcData;
bot.once('inject_allowed', () => {
    mcData = require('minecraft-data')(bot.version)
    console.log('Ok load mcData')
});


var defaultMove
var flag = false
var fishfix = false

//run the main loop of node.js
main_loop(bot);

function main_loop(bot) {

    // setInterval(()=>{
    //     console.log('update')
    // },1000)
    console.log("Play main loop");
    bot.loadPlugin(pathfinder);
    // Auto eat when hunger....
    bot.on('health', function () {
        let food = bot.food
        let health = bot.health
        if (health < 20) {
            bot.activateItem();
            console.log('eat something because low health')
        }
        else if (food < 17) {
            bot.activateItem();
            console.log('eat something because hunger')
        }
    })
    // For relogin bot when kick,idle to much or error....
    bot.on('error', function (err) {
        console.log('Error attempting to reconnect: ' + err.errno + '.');
        if (err.code == undefined) {
            console.log('Invalid credentials OR bot needs to wait because it relogged too quickly.');
            console.log('Will retry to connect in 30 seconds. ');
            setTimeout(relog, 30000);
        }
    });
    bot.on('end', function () {
        console.log("Bot has ended, Try reconnect");
        // If set less than 30s you will get an invalid credentials error, which we handle above.
        setTimeout(relog, 30000);
    });

    bot.on('playerCollect', Collect)

    function Collect(player, entity) {
        if (entity.kind === 'Drops' && player === bot.entity || player.username == '123') {
            bot.removeListener('playerCollect', onCollect)
            console.log('get something')
        }
    }

    bot.once('spawn', () => {

        defaultMove = new Movements(bot, mcData);

        bot.on('chat', (username, message) => {
            if (username === bot.username) return
            const target = bot.players[username.trim()].entity

            switch (message) {
                case 'sleep':
                    goToSleep()
                    break
                case 'wakeup':
                    wakeUp()
                    break
                case 'follow':
                    if (!target) {
                        bot.chat('where a you?? hmm')
                        break
                    }
                    bot.pathfinder.setMovements(defaultMove)
                    bot.pathfinder.setGoal(new GoalFollow(target, 2), true)
                    break
                case 'stopfollow':
                    bot.pathfinder.setGoal(null)
                    break
                case 'stat':
                    bot.chat(bot.food + ' hunger of ' + bot.username)
                    bot.chat(bot.health + ' total health of ' + bot.username)
                    break
            }
        })
        bot.on('goal_reached', (goal) => {
            console.log('ok end')
            console.log(goal)
        })
        setTimeout(() => {
            if (!fishfix) {
                bot.unequip('hand')
                find_water()
            }
            else if (fishfix) {
                stopFishing()
                setTimeout(() => {
                    bot.unequip('hand')
                    find_water()
                }, 5000)

            }
        }, 1000)
    })
    setInterval(() => {
        // console.log(fishfix)
        fishfix = fishfix
    }, 2000)
}
function find_water() {
    flag = false
    fishfix = false
    water = bot.findBlock({
        matching: ['water'].map(name => mcData.blocksByName[name].id),
        minDistance: 9, maxDistance: 10
    })
    if (water) {
        var w = water.position
        bot.pathfinder.setMovements(defaultMove)
        bot.pathfinder.setGoal(new GoalNear(w.x, w.y, w.z, 2))

        setTimeout(ready, 1000)
    }
}
function ready() {
    if (!flag) {
        bot.equip(mcData.itemsByName.fishing_rod.id, 'hand', (err) => {
            console.log('ready to start fishing')
            if (err) {
                console.log(err.message)
                setTimeout(() => {
                    stopFishing()
                    ready()
                }, 1000)

            }
            else {
                console.log('start fishing')
                setTimeout(fish_start, 2000)
            }
        })
    }
}
function fish_start() {
    bot.on('playerCollect', onCollect)
    if (!fishfix) {
        setTimeout(() => {
            bot.activateItem()
            fishfix = true
        }, 1000)
    }
    bot.on('hardcodedSoundEffectHeard', sound_detect)
}
function sound_detect(sound, cat) {
    // console.log(sound)
    // 73 is sound of fish is catched
    if (sound == 73 && fishfix) {
        bot.chat('it fish')
        console.log('fish catch')
        bot.activateItem()
        fishfix = false
        bot.removeListener('hardcodedSoundEffectHeard', sound_detect)
        console.log('remove listener')


    }
}
function onCollect(player, entity) {
    if (entity.kind === 'Drops' && player === bot.entity || player.username == '123') {
        bot.removeListener('playerCollect', onCollect)
        if (fishfix) {
            stopFishing()
        }
        setTimeout(find_hopper, 2000)

    }
}
function find_hopper() {
    flag = true
    fishfix = false
    console.log('goto store')
    hopper = bot.findBlock({
        matching: ['hopper'].map(name => mcData.blocksByName[name].id),
        maxDistance: 10
    })
    if (hopper) {
        console.log(hopper.position)
        const h = hopper.position
        bot.pathfinder.setMovements(defaultMove)
        bot.pathfinder.setGoal(new GoalNear(h.x, h.y, h.z, 2))

        setTimeout(dropItem, 5000)
    }
}
function stopFishing() {
    console.log('stop fishing k :)')
    bot.removeListener('playerCollect', onCollect)
    if (fishfix) {
        bot.activateItem()
    }
}
function dropItem() {
    var item_bot = bot.inventory.items().map(itemToString)
    var item_b = bot.inventory.items()
    console.log('being drop item >>> total item ' + item_bot.length)
    console.log(item_bot)
    // console.log(item_b)
    var avoidItem = 'fishing_rod'
    var new_array = []

    for (let i = 0; i < item_bot.length; i++) {
        // console.log(item_b[i].name+item_b[i].slot)
        if (item_b[i].name != avoidItem) {
            new_array.push(item_b[i].slot)
            console.log(item_b[i].name)
        }

    }
    console.log('item going be drop ' + new_array.length)

    try {
        for (let i = 0; i < new_array.length; i++) {
            setTimeout(function () {
                console.log(new_array[i])
                bot.clickWindow(new_array[i], 0, 0, () => {
                    bot.clickWindow(-999, 0, 0, () => {
                        console.log('out')
                    })
                })
            }, i * 1000);
            console.log(i + ' ' + new_array.length)
        }
    }
    finally {
        setTimeout(() => {
            find_water()
            console.log('done')
        }, new_array.length * 1000)
    }
}























function relog() {
    console.log("Attempting to reconnect...");
    bot = mineflayer.createBot(options);
    main_loop(bot);
}
function goToSleep() {
    const bed = bot.findBlock({
        matching: block => bot.isABed(block)
    })
    if (bed) {
        bot.sleep(bed, (err) => {
            if (err) {
                bot.chat(`can't sleep: ${err.message}`)
            }
            else {
                bot.chat("sleeping")
                console.log("Bot sleep")
            }
        })
    } else {
        bot.chat('No nearby bed')
    }


}
function wakeUp() {
    bot.wake((err) => {
        if (err) {
            bot.chat(`can't wake up: ${err.message}`)
        } else {
            bot.chat('woke up')
        }
    })
}
// Next feature for auto sleep when dawn or night
function time_() {
    let time = bot.time.day
    bot.chat(time.toString() + '');
    console.log(time.toString() + '');

}
function sayItems(items = bot.inventory.items()) {
    const out = items.map(itemToString).join(', ')
    if (out) {
        bot.chat(out)
    }
    else {
        bot.chat('empty')
    }
}
function itemToString(item) {
    if (item) {
        return `${item.name} x ${item.count}`
    }
    else {
        return '(nothing)'
    }
}
function itemByName(items, name) {
    let item
    let i
    for (i = 0; i < items.length; ++i) {
        item = items[i]
        if (item && item.name === name) return item
    }
    return null
}