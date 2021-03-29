# Solar Positioning

This library computes the position of the sun for a given moment in time.

I wrote this for my own educational purposes and can not guarantee it's
accuracy or correctness. Please consider using other libraries elsewhere. I'm
primarily publishing it so that I can use it from ObservableHQ and that others
smarter than me can tell me where I made mistakes.

The values that I have tested for seem to be accurate within 0.05º for angular
units and within 2'000 km for the distance (comparing to other sources) but I'm
not sure what corner cases I am missing. See the tests for details.

Thanks,
Philipp