export default class Bucket {

    constructor (sim, data) {
        const totalSize = sim.bucketsData.reduce((a,b)=>a+b.relativeSize, 0)
        const percentOfTotalPopulation = data.relativeSize / totalSize;
        const population = sim.state.population * percentOfTotalPopulation;
        const initialInfected = sim.state.initialInfected * percentOfTotalPopulation;

        this.sim = sim;
        this.population = population;
        this.interactionRate = data.spreadMultiple;
        this.totalInfected = initialInfected;
        this.infectedByDay = [initialInfected];
        this.totalDeaths = 0;
        this.newInfections = 0;
        this.newDeaths = 0;

        this.spreadMult = this.sim.R0Adj * percentOfTotalPopulation / this.sim.state.infectiveDays;
        // console.log(percentOfTotalPopulation, population, initialInfected)
    }

    getUninfected = () => {
        return this.population - this.totalInfected;
    }

    getPeopleIncubating = () => {
        const to = this.sim.state.incubationDays;
        return this.infectedByDay.slice(0, to).reduce((a,b)=>a+b, 0);
    }

    getPeopleInfectious = () => {
        const from = this.sim.state.incubationDays;
        const to = this.sim.state.incubationDays + this.sim.state.infectiveDays;
        // console.log(this.infectedByDay)
        return this.infectedByDay.slice(from, to).reduce((a,b)=>a+b, 0);
    }

    startDay = (day) => {
        // Add new day
        this.day = day;
        this.infectedByDay.unshift(0);
        this.newInfections = 0;
        
        // // Some people die
        // const deathDay = this.sim.state.incubationDays + this.sim.state.averageDaysUntilDeath
        // this.newDeaths = (this.infectedByDay[deathDay] || 0) * this.sim.state.ifr;
        // this.totalDeaths += this.newDeaths;
        
    }

    processInteractions = (fromBucket) => {
        // console.log('processInteractions')
        const totalInteractionRate = fromBucket.interactionRate * this.interactionRate * this.sim.getMitigationMult();
        const uninfectedRatio = this.getUninfected() / this.population;
        const newInfections = fromBucket.getPeopleInfectious() * totalInteractionRate * uninfectedRatio * this.spreadMult;
        // console.log(fromBucket.getPeopleInfectious(), uninfectedRatio, newInfections);
        // console.log({uninfectedRatio, newInfections})
        this.newInfections += newInfections

    }

    endDay = () => {
        this.infectedByDay[0] = this.newInfections;
        this.totalInfected += this.newInfections;
    }

}