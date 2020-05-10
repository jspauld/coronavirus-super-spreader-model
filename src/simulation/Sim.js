import Bucket from './Bucket';
import * as utils from './utils';

export default class Sim {

    constructor (state) {
        this.state = state;
        this.day = 0
        this.bucketsData = state.useBuckets ? state.buckets : state.naiveModelBuckets;
        this.R0Adj = this.calculateR0Adj(this.bucketsData);
        this.buckets = this.bucketsData.map(data=>new Bucket(this, data))
        this.dailyData = {
            infectious: [],
            infected: [],
            deaths: [],
            effectiveR0: [],   
        }
    }

    // This function calculates an adjust R0 such that our initial observable R0 is equal to what is set (initialR0)
    calculateR0Adj = (buckets) => {
        let values = [];
        let weights = [];
        buckets.forEach(b1=>{
            buckets.forEach(b2=>{
                values.push(b1.spreadMultiple * b2.spreadMultiple);
                weights.push(b1.spreadMultiple * b1.relativeSize * b2.relativeSize);
            });
        });
        const mean = utils.weightedMean(values, weights)
        return this.state.initialR0 / mean;
    }

    getResults = (done=false) => {
        if (done || this.state.useAnimate) {
            const startIndex = this.dailyData.effectiveR0.findIndex(r=>r>1)
            const immuneIndex = this.dailyData.effectiveR0.findIndex((r,i)=>r < 1 && i > startIndex && !this.inLockdown(i+1));
            const immuneAt = (immuneIndex > 2) ? (this.dailyData.infected[immuneIndex-1] + this.dailyData.infected[immuneIndex-2]) / 2 : 0
            const herdImmunity = Array(this.dailyData.effectiveR0.length).fill(immuneAt);
            const buckets = this.getChartBuckets();
            const bucketCategories = this.getChartBucketsCategories();
            return {
                bucketsUsed: this.state.useBuckets,
                infectious: this.dailyData.infectious, 
                infected: this.dailyData.infected, 
                deaths: this.dailyData.deaths, 
                effectiveR0: this.dailyData.effectiveR0, 
                buckets, 
                bucketCategories, 
                herdImmunity
            }     
        }
    }

    processDay = (day) => {
        this.day = day;
        // Process buckets
        this.buckets.map(b=>b.startDay(day));
        this.startOfDayInfectious = this.getInfectious();
        this.buckets.forEach(bucket1=>{
            this.buckets.forEach(bucket2=>{
                bucket2.processInteractions(bucket1)
            });
        });
        this.buckets.map(b=>b.endDay());
        // Add to daily stats
        this.dailyData.infectious.push(this.getInfectiousPercent())
        this.dailyData.infected.push(this.getInfectedPercent())
        this.dailyData.deaths.push(this.getDeathsPercent())
        this.dailyData.effectiveR0.push(this.getEffectiveR0())

        return this.getResults();
    }

    finishRun = () => {
        this.buckets.forEach(b=>{
            console.log('--------- bucket ---------')
            console.log(`Interaction Rate: ${b.interactionRate}`)
            // console.log(`Infectious ${b.getPeopleInfectious()}`)
            console.log(`Infected: ${b.totalInfected/b.population}`)
            // console.log(`Deaths: ${b.totalDeaths}`)
        })
        return this.getResults(true);
    }

    getInfectious = () => this.buckets.map(b=>b.getPeopleInfectious()).reduce((a,b)=>a+b);
    getInfected = () => this.buckets.map(b=>b.totalInfected).reduce((a,b)=>a+b);
    getDeaths = () => this.buckets.map(b=>b.totalDeaths).reduce((a,b)=>a+b);
    getNewInfections = () => this.buckets.map(b=>b.newInfections).reduce((a,b)=>a+b);
    getNewDeaths = () => this.buckets.map(b=>b.newDeaths).reduce((a,b)=>a+b);
    
    getInfectiousPercent = () => this.getInfectious() / this.state.population;
    getInfectedPercent = () => this.getInfected() / this.state.population
    getDeathsPercent = () => this.getDeaths() / this.state.population

    getEffectiveR0 = () => {
        const newInfections = this.getNewInfections()
        const effectiveR0 = (newInfections / this.startOfDayInfectious * this.state.infectiveDays) || 0;
        return effectiveR0
    }

    getChartBuckets = () => {
        return this.buckets.map((b, i)=>({x: i+1, y: b.totalInfected/b.population}));
    }

    getChartBucketsCategories = () => {
        let labels = []
        this.buckets.forEach(b=>{
            const label = this.getLabel(`${b.interactionRate}x`, labels);
            labels.push(label);
        });
        return labels
    }

    getLabel = (baseLabel, existing, attempt=0) => {
        const label = attempt === 0 ? baseLabel : `${baseLabel}.${attempt}`;
        if (existing.includes(label)) {
            return this.getLabel(baseLabel, existing, attempt+1)
        } else {
            return label
        }
    }

    inLockdown = (day) => {
        if (this.state.lockdownEffectiveness > 0) {          
            const lockdownEnd = this.state.lockdownStart + this.state.lockdownDays;
            return day >= this.state.lockdownStart && day < lockdownEnd;  
        }
    }

    getMitigationMult = () => {
        return (this.inLockdown(this.day)) ? 1 - this.state.lockdownEffectiveness : 1;
    }

}