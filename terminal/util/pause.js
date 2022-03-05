function pause(s = 1){
    return new Promise(resolve => setTimeout(resolve, 1000*Number(s)));
}

export default pause;