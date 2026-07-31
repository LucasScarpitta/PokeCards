import { useRunState } from './state/useRunState'
import { HomeScreen } from './screens/HomeScreen'
import { StarterSelect } from './screens/StarterSelect'
import { RunMapView } from './components/RunMapView'
import { BattleScreen } from './screens/BattleScreen'
import { PostBattleScreen } from './screens/PostBattleScreen'
import { CatchScreen } from './screens/CatchScreen'
import { EndScreen } from './screens/EndScreen'
import { MarketScreen } from './screens/MarketScreen'
import { ToastContainer } from './components/Toast'
import { LoadingOverlay } from './components/LoadingOverlay'

export default function App() {
  const [state, dispatch, loading] = useRunState()

  return (
    <div className="app">
      <LoadingOverlay visible={loading} />
      <ToastContainer />

      {state.screen === 'home' && (
        <HomeScreen
          onNewRun={() => dispatch({ type: 'NEW_RUN' })}
          onContinue={() => dispatch({ type: 'CONTINUE_RUN' })}
          loading={loading}
        />
      )}

      {state.screen === 'starter' && (
        <StarterSelect
          onSelect={(speciesId) => dispatch({ type: 'SELECT_STARTER', speciesId })}
          loading={loading}
        />
      )}

      {state.screen === 'map' && (
        <RunMapView
          state={state}
          onSelectNode={(nodeId) => dispatch({ type: 'SELECT_NODE', nodeId })}
          onOpenMarket={() => dispatch({ type: 'OPEN_MARKET' })}
          loading={loading}
        />
      )}

      {state.screen === 'market' && (
        <MarketScreen
          state={state}
          onBuy={(itemId) => dispatch({ type: 'BUY_ITEM', itemId })}
          onUse={(itemId, pokemonUid) => dispatch({ type: 'USE_ITEM', itemId, pokemonUid })}
          onClose={() => dispatch({ type: 'CLOSE_MARKET' })}
          loading={loading}
        />
      )}

      {state.screen === 'battle' && state.battle && (
        <BattleScreen
          state={state}
          onBattleUpdate={(battle) => dispatch({ type: 'BATTLE_UPDATED', battle })}
          onBattleEnd={(party, postBattle) =>
            dispatch({ type: 'BATTLE_END', party, postBattle })
          }
          onGameOver={() => dispatch({ type: 'GAME_OVER' })}
        />
      )}

      {state.screen === 'post-battle' && state.postBattle && (
        <PostBattleScreen
          result={state.postBattle}
          onContinue={() => dispatch({ type: 'RETURN_TO_MAP' })}
          loading={loading}
        />
      )}

      {state.screen === 'catch' && state.catchOffer && (
        <CatchScreen
          offer={state.catchOffer}
          party={state.party}
          fromItem={state.catchFromItem}
          onAccept={(replaceUid) =>
            dispatch({ type: 'CATCH_POKEMON', accept: true, replaceUid })
          }
          onDecline={() => dispatch({ type: 'CATCH_POKEMON', accept: false })}
          loading={loading}
        />
      )}

      {state.screen === 'game-over' && (
        <EndScreen
          variant="game-over"
          state={state}
          onRestart={() => dispatch({ type: 'RESET' })}
          loading={loading}
        />
      )}

      {state.screen === 'victory' && (
        <EndScreen
          variant="victory"
          state={state}
          onRestart={() => dispatch({ type: 'NEW_RUN' })}
          loading={loading}
        />
      )}
    </div>
  )
}
