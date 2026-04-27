import type { DashboardOverviewProps } from "../types";
import { CardsPanel } from "./CardsPanel";
import { DoorControlCard } from "./DoorControlCard";
import { HistoryChartCard } from "./HistoryChartCard";
import { IntruderAlertHistoryPanel } from "./IntruderAlertHistoryPanel";
import { MetricCard } from "./MetricCard";

export function DashboardOverview({
  latest,
  history,
  intruderAlertHistory,
  busy,
  intruderActionSubmitting,
  doorState,
  showTempFull,
  showHumiFull,
  tempRecentData,
  tempFullData,
  humiRecentData,
  humiFullData,
  chartOptions,
  chartReady,
  admin,
  authChecking,
  cardSubmitting,
  cards,
  editingCardNum,
  editingValue,
  newCardNum,
  onDoorChange,
  onShowTempRecent,
  onShowTempFull,
  onShowHumiRecent,
  onShowHumiFull,
  onAddCard,
  onDeleteCard,
  onEditCard,
  onNewCardNumChange,
  onSaveEdit,
  onCancelEdit,
  onEditingValueChange,
  onOpenAdminLogin,
  onAcknowledgeIntruderAlert,
  onDialEmergencyIntruderAlert
}: DashboardOverviewProps) {
  return (
    <>
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <MetricCard title="Temperature" value={latest?.temperature?.toFixed(1) ?? "--"} unit="C" />
        <MetricCard
          title="Humidity"
          value={latest?.humidity?.toFixed(0) ?? "--"}
          unit="%"
          animationDelayClass="[animation-delay:70ms]"
        />
        <DoorControlCard busy={busy} doorState={doorState} onDoorChange={onDoorChange} />
      </section>

      <section className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <HistoryChartCard
          title="Temperature Chart"
          totalPoints={history.length}
          showingFull={showTempFull}
          recentData={tempRecentData}
          fullData={tempFullData}
          options={chartOptions}
          chartReady={chartReady}
          onShowRecent={onShowTempRecent}
          onShowFull={onShowTempFull}
        />
        <HistoryChartCard
          title="Humidity Chart"
          totalPoints={history.length}
          showingFull={showHumiFull}
          recentData={humiRecentData}
          fullData={humiFullData}
          options={chartOptions}
          chartReady={chartReady}
          animationDelayClass="[animation-delay:80ms]"
          onShowRecent={onShowHumiRecent}
          onShowFull={onShowHumiFull}
        />
      </section>

      <CardsPanel
        admin={admin}
        authChecking={authChecking}
        cardSubmitting={cardSubmitting}
        cards={cards}
        editingCardNum={editingCardNum}
        editingValue={editingValue}
        newCardNum={newCardNum}
        onAddCard={onAddCard}
        onDeleteCard={onDeleteCard}
        onEditCard={onEditCard}
        onNewCardNumChange={onNewCardNumChange}
        onSaveEdit={onSaveEdit}
        onCancelEdit={onCancelEdit}
        onEditingValueChange={onEditingValueChange}
      />

      <IntruderAlertHistoryPanel
        alerts={intruderAlertHistory}
        admin={admin}
        authChecking={authChecking}
        intruderActionSubmitting={intruderActionSubmitting}
        onOpenAdminLogin={onOpenAdminLogin}
        onAcknowledgeIntruderAlert={onAcknowledgeIntruderAlert}
        onDialEmergencyIntruderAlert={onDialEmergencyIntruderAlert}
      />
    </>
  );
}
