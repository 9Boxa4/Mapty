'use strict';

// prettier-ignore


const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');
const sortBtn = document.querySelector('.sort')



class Workout{
    date = new Date()
    id = (Date.now()+ "").slice(-10)
    clicks=0
    constructor(distance,duration,coords){
        this.distance = distance //km
        this.duration = duration //min
        this.coords = coords //lat & long
    }

    _setDiscription(){
        const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
       
        
        this.description = `${this.type[0].toUpperCase()}${this.type.slice(1)} on ${months[this.date.getMonth()]} ${this.date.getDate()}`
    }

    click(){
        this.clicks++;
    }
}

class Running extends Workout{
    type = 'running'
    constructor(distance,duration,coords,cadence){
        super(distance,duration,coords)
        this.cadence = cadence
        this.calcPace()
        this._setDiscription();
    }

    calcPace(){
        this.pace = this.duration/ this.distance
        return this.pace
    }
}

class Cycling extends Workout{
    type = 'cycling'
    constructor(distance,duration,coords,elevationGain){
        super(distance,duration,coords)
        this.elevation = elevationGain
        this.calcSpeed()
        this._setDiscription();
    }

    calcSpeed(){
        this.speed = (this.distance/(this.duration/60))
        return this.speed
    }
}

class App {
    #workouts =[];
    #mapZoomLevel=16;
    #map;
    #mapEvent;
    #sort=false;
    constructor()
    {
        //get the current position
       this._getPosition()

       //get data from local storage
       this._getLocalStorage();

       //attach event handlers
       form.addEventListener('submit',this._newWorkout.bind(this));
       inputType.addEventListener('change', this._toggleElevationField)
       containerWorkouts.addEventListener('click', this._moveToPopup.bind(this))
       containerWorkouts.addEventListener('click',this._removeWorkout.bind(this))
    }

    _getPosition(){
        if(navigator.geolocation)
        {
            navigator.geolocation.getCurrentPosition(
            this._loadMap.bind(this),
            (err)=>
            {console.log(`Mistake`);})
    }
    };

    _loadMap(position)
        {
            const {latitude,longitude} = position.coords
            const coords = [latitude,longitude]
            
             this.#map = L.map('map')
            .setView(coords, this.#mapZoomLevel);
            
            L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        })
        .addTo(this.#map);
    

        //handling clicks on map
        this.#map.on('click', this._showForm.bind(this))

      this.#workouts.forEach(work=>
        {
            this._renderWorkoutMarker(work);
        })
    };

    _showForm(mapE){
        this.#mapEvent = mapE
       
        form.classList.remove('hidden');
        inputDistance.focus();
        
    };

    _toggleElevationField(){
        inputCadence.closest('.form__row').classList.toggle('form__row--hidden');
        inputElevation.closest('.form__row').classList.toggle('form__row--hidden')
    };

    _newWorkout(e){
         //valid inputs
         const validInputs = (...inputs) =>inputs.every(inp=> Number.isFinite(inp));

         const allPositive = (...inputs) =>inputs.every(inp=> inp>0)
         
        e.preventDefault();

        //clear input fields

        // getting data from form
        const type = inputType.value
        const distance = +inputDistance.value
        const duration = +inputDuration.value
        const {lat,lng} = this.#mapEvent.latlng
        let workout;

       // if type is running create running object
        
        if (type === 'running') {
            const cadence = +inputCadence.value;
      
            // Check if data is valid
            if (!validInputs(distance, duration, cadence) ||
              !allPositive(distance, duration, cadence))
              return alert('Inputs have to be positive numbers!');
      
            workout = new Running( distance, duration,[lat, lng],cadence);
          }

        //if type is cycling, cycling object
        if(type === 'cycling')
        {
            const elevation = +inputElevation.value

            if(!validInputs(distance,duration,elevation) ||
            !allPositive(distance,duration)) return alert('Nope')

            workout = new Cycling( distance, duration,[lat, lng], elevation);
        }

        //adding a wokrout
         this.#workouts.push(workout)

         //rendering the workout marker
         this._renderWorkoutMarker(workout);

        this._renderWorkout(workout);
      

        // this._hideForm();
        this._hideForm();

        //set local storage to our workout
        this._setLocalStorage();
    }

  _hideForm(){
    //clear input fields
inputCadence.value = inputDistance.value = inputDuration.value = inputElevation.value =""

    if(!form.classList.contains('hidden')){
    form.classList.add('hidden')
    setTimeout(()=>form.style.display = "grid",1000)
    }
  }
    _renderWorkoutMarker(workout)
    {
       const marker = L.marker(workout.coords)
       marker
        .addTo(this.#map)
        .bindPopup(
        L.popup({
            maxWidth: 250,
            minWidth:100,
            className:`${workout.type}-popup`,
            closeButton:true,
            autoClose:false,
            closeOnClick:false,
        }))
        .setPopupContent(workout.type === 'running'?`🏃‍♂️ ${workout.description}`:`🚴‍♀️ ${workout.description}` )
        .openPopup()
    

    }

    _renderWorkout(workout){
        let html =       ` <li class="workout workout--${workout.type}" data-id="${workout.id}">
        <h2 class="workout__title">${workout.description} <span class="edit__workout">🗑</span></h2>
        <div class="workout__details">
          <span class="workout__icon">${workout.type ==='running'?`🏃‍♂️`: `🚴‍♀️` }</span>
          <span class="workout__value">${workout.distance}</span>
          <span class="workout__unit">km</span>
        </div>
        <div class="workout__details">
          <span class="workout__icon">⏱</span>
          <span class="workout__value">${workout.duration}</span>
          <span class="workout__unit">min</span>
        </div>`

        if(workout.type === 'running')
        {
            html += `<div class="workout__details">
            <span class="workout__icon">⚡️</span>
            <span class="workout__value">${workout.pace.toFixed(1)}</span>
            <span class="workout__unit">min/km</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">🦶🏼</span>
            <span class="workout__value">${workout.cadence}</span>
            <span class="workout__unit">spm</span>
          </div>
        </li>`
        }

        if(workout.type === 'cycling')
        {
            html += `<div class="workout__details">
            <span class="workout__icon">⚡️</span>
            <span class="workout__value">${workout.speed.toFixed(1)}</span>
            <span class="workout__unit">km/h</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">🗻</span>
            <span class="workout__value">${workout.elevation}</span>
            <span class="workout__unit">m</span>
          </div>`
        }
        
        form.insertAdjacentHTML('afterend',html)

    }

    _moveToPopup(e){
        const workoutEl =e.target.closest('.workout');
        // console.log(workoutEl);

        if(!workoutEl)return

        const workout = this.#workouts.find(work=> work.id === workoutEl.dataset.id)

        this.#map.setView(workout.coords,this.#mapZoomLevel, {
            animate:true,
            pan: {
                duration:1,
            }
        })

           //using the public interface
        //    workout.click();
    }
 
    _removeWorkout(e){
       const workoutEl = e.target.closest('.workout')
       if(e.target.classList.contains('edit__workout'))
       {
              const workout = this.#workouts.find(work=> work.id === workoutEl.dataset.id)
                    //    this.#workouts.filter(work=> work.id !== workout)       
const confirmation = confirm(`Are you sure about deleting this workout?`)  
if(confirmation)
{
    //deleting the specific index from an array and setting it to local storage
    this.#workouts.splice(this.#workouts.indexOf(workout),1)
    this._setLocalStorage();
    
    //remove the popUp
    
    //removing the element from the dom
    workoutEl.remove()
    location.reload();
}           

        }
    }

    _setLocalStorage(){
        localStorage.setItem('workouts', JSON.stringify(this.#workouts))
    }

    _getLocalStorage(){
      const data= JSON.parse(localStorage.getItem('workouts'))
    //   console.log(data);

      if(!data) return;

      this.#workouts=data;
      this.#workouts.forEach(work=>
        {
            this._renderWorkout(work);
        })

        
    }

    reset(){
        localStorage.removeItem('workouts');
        location.reload();
    }

 }

const app = new App();




