import Bucket from './Bucket';
import * as utils from './utils';

export default class Sim {

    constructor (state) {
        this.state = state;
        const oneBucket = [{bucketSize: 1, spread: 1}]
        this.bucketsData = state.useBuckets ? state.buckets : oneBucket;
        this.R0Adj = this.calculateR0Adj(this.bucketsData);
        this.buckets = this.bucketsData.map(data=>new Bucket(this, data))
    }

    // This function calculates an adjust R0 such that our initial observable R0 is equal to what is set (initialR0)
    calculateR0Adj = (buckets) => {
        let values = [];
        let weights = [];
        buckets.forEach(b1=>{
            buckets.forEach(b2=>{
                values.push(b1.spread * b2.spread);
                weights.push(b1.spread * b1.bucketSize * b2.bucketSize);
            });
        });
        const mean = utils.weightedMean(values, weights)
        return this.state.initialR0 / mean;
    }

    startDay = (day) => {
        this.buckets.map(b=>b.startDay(day));
        this.buckets.forEach(bucket1=>{
            this.buckets.forEach(bucket2=>{
                bucket2.processInteractions(bucket1)
            });
        });
    }

    getInfectious = () => {
        return this.buckets.map(b=>b.getPeopleInfectious()).reduce((a,b)=>a+b);
    }

    getTotalInfected = () => {
        return this.buckets.map(b=>b.totalInfected).reduce((a,b)=>a+b);
    }

    getTotalDeaths = () => {
        return this.buckets.map(b=>b.totalDeaths).reduce((a,b)=>a+b);
    }

    getNewInfections = () => {
        return this.buckets.map(b=>b.newInfections).reduce((a,b)=>a+b);
    }

    getNewDeaths = () => {
        return this.buckets.map(b=>b.newDeaths).reduce((a,b)=>a+b);
    }

    getEffectiveR0 = () => {
        return (this.getNewInfections() / this.getInfectious() * this.state.infectiveDays) || 0;
    }

    getChartBuckets = () => {
        return this.buckets.map((b, i)=>({x: i+1, y: b.totalInfected/b.population}));
    }

    getChartBucketsCategories = () => {
        let existing = [];
        let labels = []
        this.buckets.forEach(b=>{
            const label = this.getLabel(`${b.interactionRate}x`, labels);
            labels.push(label);
        });
        return labels
    }

    getLabel = (baseLabel, existing, attempt=0) => {
        const label = attempt == 0 ? baseLabel : `${baseLabel}.${attempt}`;
        console.log(label, existing)
        if (existing.includes(label)) {
            return this.getLabel(baseLabel, existing, attempt+1)
        } else {
            return label
        }
    }

    onComplete = () => {
        this.buckets.forEach(b=>{
            console.log('--------- bucket ---------')
            console.log(`Interaction Rate: ${b.interactionRate}`)
            // console.log(`Infectious ${b.getPeopleInfectious()}`)
            console.log(`Infected: ${b.totalInfected/b.population}`)
            // console.log(`Deaths: ${b.totalDeaths}`)
        })
    }

}