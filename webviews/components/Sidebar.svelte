<script lang="ts">
    const options = ["Transpile", "Declare", "Deploy"];
    let text = '';
</script>

<button on:click={()=>{
    tsvscode.postMessage({type: "transpile", value: "transpile message"})    
}}>Transpile</button>