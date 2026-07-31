import { useState } from 'react'
import { SHOP_CATALOG, formatBuffSummary, getItemPrice, getShopItem } from '../game/items'
import type { ItemId, PokemonInstance, RunState } from '../models/types'
import { GoldDisplay } from '../components/GoldDisplay'
import { ScreenHeader } from '../components/ScreenHeader'

interface MarketScreenProps {
  state: RunState
  onBuy: (itemId: ItemId) => void
  onUse: (itemId: ItemId, pokemonUid?: string) => void
  onClose: () => void
  loading?: boolean
}

export function MarketScreen({
  state,
  onBuy,
  onUse,
  onClose,
  loading,
}: MarketScreenProps) {
  const [selectedItem, setSelectedItem] = useState<ItemId | null>(null)

  const ownedItems = SHOP_CATALOG.filter(
    (item) => item.kind !== 'pokeball' && state.inventory[item.id] > 0,
  )
  const selectedShopItem = selectedItem ? getShopItem(selectedItem) : null

  return (
    <div className="screen market-screen">
      <ScreenHeader
        title="PokéMarket"
        subtitle="Buy supplies for your journey."
        aside={<GoldDisplay amount={state.gold} />}
      />

      {state.pendingBattleBuffs.length > 0 && (
        <div className="buff-banner">
          Active for next battle: {formatBuffSummary(state.pendingBattleBuffs)}
        </div>
      )}

      <section className="market-section">
        <h2>Shop</h2>
        <div className="shop-grid">
          {SHOP_CATALOG.map((item) => {
            const price = getItemPrice(item.id, state.pokeballsBought)
            const canAfford = state.gold >= price
            return (
              <div
                key={item.id}
                className={`shop-item ${canAfford ? '' : 'unaffordable'}`}
              >
                <div className="shop-item-info">
                  <strong>{item.name}</strong>
                  <p>{item.description}</p>
                  <span className="shop-price">{price} G</span>
                  {item.kind === 'pokeball' && state.pokeballsBought > 0 && (
                    <span className="shop-note">
                      Next: {getItemPrice('pokeball', state.pokeballsBought + 1)} G
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  className="btn primary"
                  disabled={!canAfford || loading}
                  onClick={() => onBuy(item.id)}
                >
                  {item.kind === 'pokeball' ? 'Buy & Catch' : 'Buy'}
                </button>
              </div>
            )
          })}
        </div>
      </section>

      <section className="market-section">
        <h2>Bag</h2>
        {ownedItems.length === 0 ? (
          <p className="empty-bag">No items yet. Win battles to earn gold!</p>
        ) : (
          <div className="bag-list">
            {ownedItems.map((item) => (
              <div key={item.id} className="bag-item">
                <div>
                  <strong>{item.name}</strong>
                  <span className="bag-qty">×{state.inventory[item.id]}</span>
                  <p>{item.description}</p>
                </div>
                <ItemUseButton
                  itemId={item.id}
                  kind={item.kind}
                  loading={loading}
                  onUse={onUse}
                  onSelectTarget={setSelectedItem}
                  selectedItem={selectedItem}
                />
              </div>
            ))}
          </div>
        )}
      </section>

      {selectedShopItem && (selectedShopItem.kind === 'heal' || selectedShopItem.kind === 'revive') && (
        <div className="modal-backdrop" onClick={() => setSelectedItem(null)}>
          <div className="modal-panel heal-picker" onClick={(e) => e.stopPropagation()}>
            <TargetPicker
              itemId={selectedItem!}
              party={state.party}
              mode={selectedShopItem.kind}
              onTarget={(pokemonUid) => {
                onUse(selectedItem!, pokemonUid)
                setSelectedItem(null)
              }}
              onCancel={() => setSelectedItem(null)}
            />
          </div>
        </div>
      )}

      <button
        type="button"
        className="btn secondary market-back"
        onClick={onClose}
        disabled={loading}
      >
        Back to Map
      </button>
    </div>
  )
}

function ItemUseButton({
  itemId,
  kind,
  loading,
  onUse,
  onSelectTarget,
  selectedItem,
}: {
  itemId: ItemId
  kind: ReturnType<typeof getShopItem>['kind']
  loading?: boolean
  onUse: (itemId: ItemId, pokemonUid?: string) => void
  onSelectTarget: (id: ItemId | null) => void
  selectedItem: ItemId | null
}) {
  if (kind === 'battle-buff') {
    return (
      <button type="button" className="btn secondary" disabled={loading} onClick={() => onUse(itemId)}>
        Activate
      </button>
    )
  }

  if (kind === 'pokeball') {
    return null
  }

  return (
    <button
      type="button"
      className="btn secondary"
      disabled={loading}
      onClick={() => onSelectTarget(selectedItem === itemId ? null : itemId)}
    >
      Use
    </button>
  )
}

function TargetPicker({
  itemId,
  party,
  mode,
  onTarget,
  onCancel,
}: {
  itemId: ItemId
  party: PokemonInstance[]
  mode: 'heal' | 'revive'
  onTarget: (pokemonUid: string) => void
  onCancel: () => void
}) {
  const item = getShopItem(itemId)

  return (
    <>
      <h3>Use {item.name} on...</h3>
      <div className="heal-targets">
        {party.map((mon) => {
          const canUse =
            mode === 'heal'
              ? mon.currentHp > 0 && mon.currentHp < mon.maxHp
              : mon.currentHp <= 0

          return (
            <button
              key={mon.uid}
              type="button"
              className={`heal-target ${mon.currentHp <= 0 ? 'fainted' : ''}`}
              disabled={!canUse}
              onClick={() => onTarget(mon.uid)}
            >
              <img src={mon.spriteUrl} alt={mon.name} />
              <span>{mon.name}</span>
              <span className="heal-hp">
                {mon.currentHp <= 0 ? 'Fainted' : `${mon.currentHp}/${mon.maxHp} HP`}
              </span>
            </button>
          )
        })}
      </div>
      <button type="button" className="btn secondary" onClick={onCancel}>
        Cancel
      </button>
    </>
  )
}
