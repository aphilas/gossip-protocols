/**
 * Node states enum
 */
const STATES = {
  susceptible: 1,
  infected: 2,
  removed: 3,
}

/**
 * Promise-based implementaion of sleep()
 * @param {number} duration Delay in milliseconds
 */
const sleep = duration => new Promise(resolve => setTimeout(resolve, duration))

class Node {
  _state = STATES.susceptible
  observers = []

  /**
   * Create a node
   * @param {number|string} id Node id
   * @param {World} world Node's parent world
   */
  constructor(id, world) {
    this.id = id
    this.world = world
  }  

  /**
   * Set state proxy to notify world
   */
  set state(newState) {
    if (newState == STATES.infected && this.state != STATES.infected) {
      this.publish('infected')
    }  

    this._state = newState
  }

  get state() {
    return this._state
  }

  /**
   * Pick a random node in the world
   */
  getPartner() {
    let partnerId = this.randomNodeId()
    while (partnerId == this.id) partnerId = this.randomNodeId()

    this.partner = this.world.nodes[partnerId]
    return this.partner
  }

  pushMessage() {
    const partner = this.getPartner()

    if (partner.state == STATES.susceptible) {
      partner.state = STATES.infected
    }

    return partner
  }

  subscribe(observer) {
    this.observers.push(observer)
  }

  publish(message) {
    this.observers.forEach(observer => {
      observer.notify(message)
    })
  }

  randomNodeId() {
    return Math.floor(Math.random() * this.world.nodes.length)
  }
}

const generateNodes = number => Array.from({ length: number }, (v, i) => new Node(i))

class World{
  infected = 0
  removed = 0

  constructor(nodes, nodeToInfect = 0) {
    this.nodes = nodes

    this.nodes.forEach(node => {
      node.subscribe(this)
      node.world = this
    })

    this.nodes[nodeToInfect].state = STATES.infected
  }

  notify(message) {
    if (message == 'infected') this.infected += 1
  }

  static toss(k) {
    if (Math.random() < k) return true
  }
}

class FixedWorld extends World {
  constructor(nodes) {
    super(nodes)
  }

  run(count) {
    if (count > this.nodes.length) count = this.nodes.length

    let i = 0
    while (true) {
      if (this.tick(count)) {
        console.log(`Round ${i + 1}, ${this.infected} infected`)
        return
      }
      i += 1
    }
    
  }

  tick(count) {
    for (const node of this.nodes) {
      if (this.infected >= count) return true
  
      if (node.state == STATES.infected) {
        node.pushMessage()
      }
    }
  }
}

console.log('Fixed: ')

const fixedWorld = new FixedWorld(generateNodes(20))
fixedWorld.run(20)

console.log('-----------')

/**
 * Blind/coin variant (push style)
 */
class BlindWorld extends World {
  // removed = 0

  constructor(nodes, nodeToInfect = 0) {
    super(nodes, nodeToInfect)
  }

  /**
   * 
   * @param {number} k Probability k
   */
  run(k) {
    let i = 0
    while (true) {
      if (this.tick(k)) {
        console.log(`k = ${k}, ${this.infected} infected`)
        return
      }

      i += 1
    }
    
  }

  tick(k) {
    for (const node of this.nodes) {
      // exit if all nodes infected or or no node is infected or all nodes removed
      if (this.infected >= this.nodes.length) {
        // console.log('All nodes infected')
        return true
      }

      if (!this.nodes.some(node => node.state == STATES.infected)) {
        // console.log('All nodes removed or susceptible')
        return true
      }
  
      // if node is infected, push message
      if (node.state == STATES.infected) {
        node.pushMessage()

        // 'remove' with probability k
        if (World.toss(1/k)) {
          node.state = STATES.removed
          // this.removed += 1
        }
      }
    }
  }
}

console.log('Blind/coin: ')

const blindWorld = new BlindWorld(generateNodes(20))
blindWorld.run(5)

const blindWorldTwo = new BlindWorld(generateNodes(20))
blindWorldTwo.run(2)

const blindWorldThree = new BlindWorld(generateNodes(20))
blindWorldThree.run(1.2)

console.log('-----------')

/**
 * Feedback/counter - push style
 */
class FeedbackWorld extends World {
  constructor(nodes, nodeToInfect = 0) {
    super(nodes, nodeToInfect)
  }

  /**
   * 
   * @param {number} k Probability k
   */
  run(k) {
    let i = 0
    while (i < k) {
      if (this.tick(k)) return
      
      // console.log(`Round ${i}`)
      i += 1
    }
    
    console.log(`k = ${k}, ${this.infected} infected`)
  }

  tick() {
    for (const node of this.nodes) {
      if (this.infected >= this.nodes.length) {
        return true
      }

      if (!this.nodes.some(node => node.state == STATES.infected)) {
        return true
      }
  
      // if node is infected, push message
      if (node.state == STATES.infected) {
        const partner = node.pushMessage()

        // feedback - partner already infected
        if (partner.state == STATES.infected) {
          node.state = STATES.removed
          this.removed += 1
        }
      }
    }
  }
}

console.log('Feedbak/counter: ')

const feedbackWorld = new FeedbackWorld(generateNodes(20))
feedbackWorld.run(2)

const feedbackWorldTwo = new FeedbackWorld(generateNodes(20))
feedbackWorldTwo.run(5)

const feedbackWorldThree = new FeedbackWorld(generateNodes(10))
feedbackWorldThree.run(9)

console.log('-----------')