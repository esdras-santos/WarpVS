#[contract] 
mod Test {


use integer::u128_from_felt252;
use warplib::integer::u256_from_felts;


struct Storage {
  WARP_STORAGE: LegacyMap::<felt252, felt252>,
  WARP_USED_STORAGE: felt252,
  WARP_NAMEGEN: felt252,
  
}

fn readId(loc: felt252) -> felt252 {
  let id = WARP_STORAGE::read(loc);
  if id == 0 {
    let id = WARP_NAMEGEN::read();
    WARP_NAMEGEN::write(id + 1);
    WARP_STORAGE::write(loc, id + 1);
    return id + 1;
  } 
  return id;
}


    // Dynamic variables - Arrays and Maps

    // Static variables


    #[external]
    fn add_4f2be91f()-> u256{

        
        return u256_from_felts( 3, 0 );
    }


    #[constructor]
    fn constructor(){

        
        return ();
    }


}