export const POKEMON_TYPES = [
  'normal', 'fire', 'water', 'electric', 'grass', 'ice',
  'fighting', 'poison', 'ground', 'flying', 'psychic', 'bug',
  'rock', 'ghost', 'dragon', 'dark', 'steel', 'fairy',
] as const

export type PokemonType = (typeof POKEMON_TYPES)[number]

export interface PokemonStats {
  hp: number
  attack: number
  defense: number
  specialAttack: number
  specialDefense: number
  speed: number
}

export interface LearnsetEntry {
  moveId: number
  moveName: string
  level: number
}

export interface PokemonInstance {
  uid: string
  speciesId: number
  name: string
  level: number
  xp: number
  types: PokemonType[]
  baseStats: PokemonStats
  stats: PokemonStats
  currentHp: number
  maxHp: number
  spriteUrl: string
  unlockedMoveIds: number[]
  learnset: LearnsetEntry[]
}

export interface MoveCard {
  moveId: number
  name: string
  type: PokemonType
  power: number
  accuracy: number | null
  damageClass: 'physical' | 'special' | 'status'
}

export type NodeType = 'wild' | 'trainer' | 'rest' | 'catch' | 'boss'

export interface MapNode {
  id: string
  type: NodeType
  label: string
  completed: boolean
  connections: string[]
  enemySpeciesIds?: number[]
  enemyLevels?: number[]
  row: number
  col: number
}

export type Screen =
  | 'home'
  | 'starter'
  | 'map'
  | 'market'
  | 'battle'
  | 'post-battle'
  | 'catch'
  | 'game-over'
  | 'victory'

export interface BattleState {
  playerParty: PokemonInstance[]
  enemyParty: PokemonInstance[]
  playerActiveIndex: number
  enemyActiveIndex: number
  playerHand: MoveCard[]
  playerDeck: MoveCard[]
  turn: 'player' | 'enemy' | 'ended'
  winner: 'player' | 'enemy' | null
  log: string[]
  nodeType: NodeType
  xpReward: number
  mustSwitch: boolean
  pendingEnemyAction: boolean
}

export interface LevelUpInfo {
  pokemonUid: string
  pokemonName: string
  oldLevel: number
  newLevel: number
  newMoves: MoveCard[]
}

export type ItemId =
  | 'potion'
  | 'super-potion'
  | 'x-attack'
  | 'x-defend'
  | 'pokeball'
  | 'revive'

export type Inventory = Record<ItemId, number>

export interface BattleBuff {
  itemId: ItemId
  name: string
  attackMult: number
  specialAttackMult: number
  defenseMult: number
  specialDefenseMult: number
}

export interface PostBattleResult {
  xpGained: number
  goldGained: number
  levelUps: LevelUpInfo[]
  nodeId: string
}

export interface RunState {
  screen: Screen
  party: PokemonInstance[]
  map: MapNode[]
  currentNodeId: string | null
  battleNodeId: string | null
  seed: number
  badges: number
  gold: number
  inventory: Inventory
  pendingBattleBuffs: BattleBuff[]
  battle: BattleState | null
  postBattle: PostBattleResult | null
  catchOffer: PokemonInstance | null
  catchFromItem: boolean
  itemRollCounter: number
  pokeballsBought: number
}

export type TypeChart = Record<PokemonType, Partial<Record<PokemonType, number>>>
